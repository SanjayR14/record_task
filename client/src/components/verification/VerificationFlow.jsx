'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VerificationContainer from '@/components/layout/VerificationContainer';
import { useVerification } from '@/context/VerificationContext';
import verificationService from '@/services/verificationService';
import videoService from '@/services/videoService';

// Import individual modular step screens
import Step1LanguageSelection from './Step1LanguageSelection';
import Step2Instructions from './Step2Instructions';
import Step3Permissions from './Step3Permissions';
import Step4ReadyToStart from './Step4ReadyToStart';
import Step5Recording from './Step5Recording';
import Step6ReviewQuestion from './Step6ReviewQuestion';
import Step7ScenarioPrompt from './Step7ScenarioPrompt';
import Step8AllResponsesReview from './Step8AllResponsesReview';
import Step9Feedback from './Step9Feedback';
import Step11AlreadyCompleted from './Step11AlreadyCompleted';
import Step12InvalidLink from './Step12InvalidLink';

const QUESTIONS = [
  {
    number: 1,
    text: "A CNC program that produced correct parts yesterday is now making parts that are 2mm too short in one dimension. The material batch and machine settings are the same. What is the most likely cause you would investigate first in the program?"
  },
  {
    number: 2,
    text: "You arrive at a home where the kitchen sink is leaking from the faucet base. The homeowner says it's been dripping for two days. What's your first step to diagnose and fix this issue?"
  },
  {
    number: 3,
    text: "You notice a critical warehouse shelf barcode label is torn and the scanner cannot read it during peak picking hours. Describe your immediate steps to fulfill the order without causing inventory discrepancy."
  }
];

// Mapping between internal step identifiers and URL route slugs
const STEP_TO_ROUTE = {
  language: 'language',
  instructions: 'instructions',
  permissions: 'permissions',
  ready: 'ready',
  recording: 'recording',
  review_single: 'review',
  scenario_prompt: 'scenario',
  all_review: 'all-review',
  feedback: 'feedback',
  already_completed: 'completed',
  invalid: 'invalid'
};

const ROUTE_TO_STEP = {
  language: 'language',
  instructions: 'instructions',
  permissions: 'permissions',
  ready: 'ready',
  recording: 'recording',
  review: 'review_single',
  scenario: 'scenario_prompt',
  'all-review': 'all_review',
  feedback: 'feedback',
  completed: 'already_completed',
  already_completed: 'already_completed',
  'already-completed': 'already_completed',
  invalid: 'invalid'
};

export const VerificationFlow = () => {
  const params = useParams();
  const token = params?.token;
  const slug = Array.isArray(params?.slug) ? params.slug : [];
  const step = params?.step || slug[0];
  const qIdx = params?.qIdx || slug[1];
  const router = useRouter();
  const {
    setToken,
    setVerificationData,
    selectedLanguage,
    setSelectedLanguage
  } = useVerification();

  const [backendValidated, setBackendValidated] = useState(false);
  const [sessionState, setSessionState] = useState('valid'); // 'valid' | 'invalid' | 'completed' | 'expired'
  const [uploadingQuestion, setUploadingQuestion] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const storageHydratedRef = useRef(false);
  const pendingUploadsRef = useRef(new Map());

  // Track if candidate is retaking a specific question (to return directly to all_review)
  const [isRetaking, setIsRetaking] = useState(false);

  const updateIsRetaking = (val) => {
    setIsRetaking(val);
    try {
      if (val) {
        sessionStorage.setItem(`record_${token || 'default'}_is_retaking`, 'true');
      } else {
        sessionStorage.removeItem(`record_${token || 'default'}_is_retaking`);
      }
    } catch (e) { }
  };

  // Active step derived directly from URL route for native browser back / forward navigation
  const effectiveStep = (() => {
    if (sessionState === 'invalid' || token === 'invalid' || token === 'expired') return 'invalid';
    // If URL step is explicitly at feedback, show feedback without being overridden by completed state
    if (step === 'feedback') return 'feedback';
    if (sessionState === 'completed' || token === 'completed') return 'already_completed';
    if (step && ROUTE_TO_STEP[step]) return ROUTE_TO_STEP[step];
    return 'language';
  })();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => {
    if (qIdx) {
      const parsed = parseInt(qIdx, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= QUESTIONS.length) {
        return parsed - 1;
      }
    }
    return 0;
  });

  // Calculate target question index dynamically (from URL :qIdx if available, else state)
  const targetQIdx = (() => {
    if (qIdx) {
      const parsed = parseInt(qIdx, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= QUESTIONS.length) {
        return parsed - 1;
      }
    }
    return currentQuestionIndex;
  })();

  const [recordedResponses, setRecordedResponses] = useState([
    { questionNumber: 1, duration: '0:11', uploadStatus: 'pending' },
    { questionNumber: 2, duration: '0:11', uploadStatus: 'pending' },
    { questionNumber: 3, duration: '0:11', uploadStatus: 'pending' }
  ]);

  // Hydrate client-side storage state after mount to prevent Next.js SSR hydration mismatches
  useEffect(() => {
    try {
      const savedRetake =
        sessionStorage.getItem(`record_${token || 'default'}_is_retaking`) === 'true' ||
        localStorage.getItem(`record_${token || 'default'}_is_retaking`) === 'true';
      if (savedRetake) setIsRetaking(true);

      if (!qIdx) {
        const savedQ =
          sessionStorage.getItem(`record_${token || 'default'}_q_idx`) ||
          localStorage.getItem(`record_${token || 'default'}_q_idx`);
        if (savedQ !== null) {
          const parsed = parseInt(savedQ, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < QUESTIONS.length) {
            setCurrentQuestionIndex(parsed);
          }
        }
      }

      const savedResp =
        sessionStorage.getItem(`record_${token || 'default'}_responses`) ||
        localStorage.getItem(`record_${token || 'default'}_responses`);
      if (savedResp) {
        const parsedResp = JSON.parse(savedResp);
        if (Array.isArray(parsedResp) && parsedResp.length > 0) {
          setRecordedResponses((prev) =>
            prev.map((item) => {
              const found = parsedResp.find((r) => r.questionNumber === item.questionNumber);
              return found ? { ...item, ...found } : item;
            })
          );
        }
      }
    } catch (e) { }
    storageHydratedRef.current = true;
  }, [token, qIdx]);

  const [showDevControls, setShowDevControls] = useState(false);

  // Sync token into VerificationContext
  useEffect(() => {
    if (token) {
      setToken(token);
    }
  }, [token, setToken]);

  // Validate verification link and restore saved progress from MongoDB on mount/token change
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const validateSession = async () => {
      try {
        const result = await verificationService.getVerification(token);

        if (!isMounted) return;

        if (result?.code === 'INVALID_LINK') {
          setSessionState('invalid');
          if (step !== 'invalid') {
            router.replace(`/verify/${token}/invalid`);
          }
          return;
        }

        if (result?.code === 'ALREADY_COMPLETED' || result?.isCompleted) {
          setSessionState('completed');
          // If candidate is on the feedback screen, do not redirect away
          if (step === 'feedback') {
            return;
          }
          if (step !== 'completed') {
            router.replace(`/verify/${token}/completed`);
          }
          return;
        }

        if (result?.code === 'LINK_EXPIRED') {
          setSessionState('invalid');
          if (step !== 'invalid') {
            router.replace(`/verify/${token}/invalid`);
          }
          return;
        }

        if (result?.success && result?.data) {
          const data = result.data;
          setVerificationData(data);

          // Restore candidate's selected language from MongoDB (or local fallback)
          const savedLang = data.selectedLanguage || 'en';
          setSelectedLanguage(savedLang);
          try {
            localStorage.setItem(`record_${token}_lang`, savedLang);
          } catch (e) { }

          // Restore saved responses from MongoDB GridFS
          if (Array.isArray(data.responses) && data.responses.length > 0) {
            setRecordedResponses((prev) =>
              prev.map((local) => {
                const remote = data.responses.find(
                  (r) => r.questionNumber === local.questionNumber
                );
                if (remote && remote.hasVideo) {
                  return {
                    ...local,
                    uploadStatus: remote.uploadStatus || 'completed',
                    duration: remote.durationSeconds
                      ? `${Math.floor(remote.durationSeconds / 60)}:${remote.durationSeconds % 60 < 10 ? '0' : ''
                      }${remote.durationSeconds % 60}`
                      : local.duration,
                    durationSeconds: remote.durationSeconds || local.durationSeconds,
                    videoUrl: videoService.getVideoUrl(token, local.questionNumber)
                  };
                }
                return local;
              })
            );
          }

          const savedQNum =
            data.currentQuestion && data.currentQuestion >= 1 && data.currentQuestion <= QUESTIONS.length
              ? data.currentQuestion
              : 1;
          if (!qIdx) {
            setCurrentQuestionIndex(savedQNum - 1);
          }

          // Resume at MongoDB saved step across any browser when opening root link OR default /language entry link
          const QUESTION_STEPS = new Set(['scenario_prompt', 'recording', 'review_single']);
          const shouldResumeFromSaved =
            data.currentStep &&
            (!step || (step === 'language' && data.currentStep !== 'language'));

          if (shouldResumeFromSaved) {
            const resumeSlug = STEP_TO_ROUTE[data.currentStep] || 'language';
            const resumePath = QUESTION_STEPS.has(data.currentStep)
              ? `/verify/${token}/${resumeSlug}/${savedQNum}`
              : `/verify/${token}/${resumeSlug}`;
            setBackendValidated(true);
            router.replace(resumePath);
            return;
          }

          setBackendValidated(true);
        }
      } catch (err) {
        console.warn('[Verification] Backend validation offline or failed:', err.message);
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [token, router, setToken, setVerificationData, setSelectedLanguage]);

  // Keep question index updated if qIdx URL parameter changes
  useEffect(() => {
    if (qIdx) {
      const parsed = parseInt(qIdx, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= QUESTIONS.length) {
        setCurrentQuestionIndex(parsed - 1);
      }
    }
  }, [qIdx]);

  // Persist current step on change ONLY AFTER backend session validation finishes (prevents overwriting saved progress across browsers)
  useEffect(() => {
    if (!backendValidated) return;
    try {
      if (effectiveStep && effectiveStep !== 'invalid' && effectiveStep !== 'already_completed') {
        sessionStorage.setItem(`record_${token || 'default'}_step`, effectiveStep);
        localStorage.setItem(`record_${token || 'default'}_step`, effectiveStep);

        // Sync progress with backend MongoDB
        if (token && token !== 'invalid' && token !== 'completed') {
          verificationService.updateProgress(token, {
            currentStep: effectiveStep,
            currentQuestion: targetQIdx + 1,
            selectedLanguage
          });
        }
      }
    } catch (e) { }
  }, [backendValidated, effectiveStep, token, targetQIdx, selectedLanguage]);

  // Persist question index on change
  useEffect(() => {
    if (!storageHydratedRef.current) return;
    try {
      sessionStorage.setItem(`record_${token || 'default'}_q_idx`, targetQIdx.toString());
      localStorage.setItem(`record_${token || 'default'}_q_idx`, targetQIdx.toString());
    } catch (e) { }
  }, [targetQIdx, token]);

  // Persist responses on change
  useEffect(() => {
    if (!storageHydratedRef.current) return;
    try {
      sessionStorage.setItem(`record_${token || 'default'}_responses`, JSON.stringify(recordedResponses));
      localStorage.setItem(`record_${token || 'default'}_responses`, JSON.stringify(recordedResponses));
    } catch (e) { }
  }, [recordedResponses, token]);

  // Step transitions using URL navigation (creates browser history entries for Back / Forward)
  const goToStep = useCallback(
    (stepId, questionNum) => {
      const routeSlug = STEP_TO_ROUTE[stepId] || stepId;
      const targetPath = questionNum
        ? `/verify/${token}/${routeSlug}/${questionNum}`
        : `/verify/${token}/${routeSlug}`;
      router.push(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, token]
  );

  const handleSelectLanguage = (langId) => {
    setSelectedLanguage(langId);
    try {
      localStorage.setItem(`record_${token || 'default'}_lang`, langId);
    } catch (e) { }
    if (token && token !== 'invalid' && token !== 'completed') {
      verificationService.updateProgress(token, { selectedLanguage: langId });
    }
  };

  const handleLanguageContinue = (payload) => {
    const langId = payload?.language || selectedLanguage || 'en';
    handleSelectLanguage(langId);
    goToStep('instructions');
  };

  const handleInstructionsContinue = () => {
    goToStep('permissions');
  };

  const handlePermissionsGranted = async (permData) => {
    if (token && token !== 'invalid' && token !== 'completed' && permData) {
      await verificationService.updateProgress(token, {
        permissions: {
          camera: permData.camera ? 'granted' : 'denied',
          microphone: permData.microphone ? 'granted' : 'denied',
          location: permData.location ? 'granted' : 'denied'
        }
      });
    }
    goToStep('ready');
  };

  // Taking question 1 like 2 and 3 via the scenario situation prompt screen
  const handleReadyToStart = () => {
    updateIsRetaking(false);
    setCurrentQuestionIndex(0);
    goToStep('scenario_prompt', 1);
  };

  // Stop recording: Save local response immediately and upload video to MongoDB GridFS in background
  const handleStopRecording = async ({
    questionNumber,
    durationSeconds = 0,
    formattedDuration = '0:11',
    videoBlob = null,
    mimeType = 'video/webm'
  }) => {
    let localPreviewUrl = null;
    if (videoBlob) {
      try {
        localPreviewUrl = URL.createObjectURL(videoBlob);
      } catch (e) { }
    }

    setRecordedResponses((prev) =>
      prev.map((r) =>
        r.questionNumber === questionNumber
          ? {
            ...r,
            duration: formattedDuration,
            durationSeconds,
            previewUrl: localPreviewUrl,
            videoUrl: videoBlob ? null : r.videoUrl,
            uploadStatus: videoBlob ? 'uploading' : r.uploadStatus || 'pending'
          }
          : r
      )
    );

    // Requirement 1: After 3rd question is completed, go directly to all_review (no separate review screen for Q3)
    if (questionNumber === 3) {
      updateIsRetaking(false);
      goToStep('all_review');
    } else {
      goToStep('review_single', questionNumber);
    }

    // Upload actual video recording to AWS S3 via presigned URL
    if (videoBlob && token && token !== 'invalid' && token !== 'completed') {
      const uploadTask = (async () => {
        try {
          setUploadingQuestion(questionNumber);
          const result = await videoService.uploadVideo(
            token,
            questionNumber,
            videoBlob,
            durationSeconds
          );

          if (result?.success) {
            const presignedUrl = await videoService
              .getPresignedVideoUrl(token, questionNumber)
              .catch(() => '');
            setRecordedResponses((prev) =>
              prev.map((r) =>
                r.questionNumber === questionNumber
                  ? {
                    ...r,
                    uploadStatus: 'completed',
                    storageProvider: result.data?.storageProvider || 's3',
                    s3Key: result.data?.s3Key || null,
                    gridFsFileId: result.data?.fileId || null,
                    videoUrl: presignedUrl || videoService.getVideoUrl(token, questionNumber)
                  }
                  : r
              )
            );
          }
        } catch (err) {
          if (err?.data?.code === 'ALREADY_COMPLETED') {
            setSessionState('completed');
            router.replace(`/verify/${token}/completed`);
            return;
          }
          console.error(`[Upload] Failed to upload Q${questionNumber} video to AWS S3:`, err);
          setRecordedResponses((prev) =>
            prev.map((r) =>
              r.questionNumber === questionNumber
                ? { ...r, uploadStatus: 'failed', uploadError: err.message }
                : r
            )
          );
        } finally {
          if (pendingUploadsRef.current.get(questionNumber) === uploadTask) {
            pendingUploadsRef.current.delete(questionNumber);
          }
          setUploadingQuestion((curr) => (curr === questionNumber ? null : curr));
        }
      })();

      pendingUploadsRef.current.set(questionNumber, uploadTask);
      await uploadTask;
    }
  };

  const handleRetakeSingle = () => {
    goToStep('recording', targetQIdx + 1);
  };

  const handleContinueAfterReview = () => {
    // Requirement 2: If retaking a video, return directly to all_review instead of repeating subsequent questions
    if (isRetaking) {
      updateIsRetaking(false);
      goToStep('all_review');
      return;
    }

    if (targetQIdx === 0) {
      setCurrentQuestionIndex(1);
      goToStep('scenario_prompt', 2);
    } else if (targetQIdx === 1) {
      setCurrentQuestionIndex(2);
      goToStep('scenario_prompt', 3);
    } else {
      goToStep('all_review');
    }
  };

  const handleStartScenarioRecording = () => {
    goToStep('recording', targetQIdx + 1);
  };

  const handleRetakeFromAllReview = (questionNum) => {
    updateIsRetaking(true);
    setCurrentQuestionIndex(questionNum - 1);
    goToStep('recording', questionNum);
  };

  // Submit all responses to backend finish endpoint
  const handleFinishAll = async () => {
    setSubmissionError(null);

    if (pendingUploadsRef.current.size > 0) {
      await Promise.allSettled(Array.from(pendingUploadsRef.current.values()));
    }

    if (token && token !== 'invalid' && token !== 'completed') {
      try {
        const result = await verificationService.finishVerification(token);
        if (result?.success) {
          setSessionState('completed');
          updateIsRetaking(false);
          goToStep('feedback');
          return;
        }
      } catch (err) {
        // If incomplete or missing video, show message
        const errMsg =
          err.data?.message || err.message || 'Submission failed. Ensure all 3 questions are recorded.';
        setSubmissionError(errMsg);
        alert(errMsg);
        return;
      }
    }

    goToStep('feedback');
  };

  const handleFeedbackComplete = () => {
    // Keep candidate on Screen 9 ("You can close this chat now, we've got everything we need. Good luck.")
    // If they later reload or revisit the verification link, it will fetch the backend and render Step11AlreadyCompleted
  };

  // Numerical progress calculation (0 to 5 segments):
  // Initial Step 1: Language selection -> 0 / 5 (all segments default neutral-700)
  // Step 2: Instructions & Role overview (after continue from language) -> 1 / 5 (#FF5723 for 1 segment)
  // Step 3: Permissions & Ready check -> 2 / 5 (#FF5723 for 2 segments)
  // Step 4: Questions recording & review -> 3 / 5 (#FF5723 for 3 segments)
  // Step 5: All responses review -> 4 / 5 (#FF5723 for 4 segments)
  // Step 6: Feedback & completion -> 5 / 5 (#FF5723 for all 5 segments)
  const getStepProgress = () => {
    switch (effectiveStep) {
      case 'language':
        return 0; // Initial step: all segments stay default color
      case 'instructions':
        return 1; // After continue from language: 1 segment turns #FF5723
      case 'permissions':
      case 'ready':
        return 2; // 2 segments #FF5723
      case 'recording':
      case 'review_single':
      case 'scenario_prompt':
        return 3; // 3 segments #FF5723
      case 'all_review':
        return 4; // 4 segments #FF5723
      case 'feedback':
      case 'already_completed':
        return 5; // All 5 segments #FF5723
      case 'invalid':
        return 0;
      default:
        return 0;
    }
  };

  // Render active screen component
  const renderCurrentScreen = () => {
    switch (effectiveStep) {
      case 'language':
        return <Step1LanguageSelection onContinue={handleLanguageContinue} />;

      case 'instructions':
        return <Step2Instructions onContinue={handleInstructionsContinue} />;

      case 'permissions':
        return <Step3Permissions onGrantPermissions={handlePermissionsGranted} />;

      case 'ready':
        return <Step4ReadyToStart onStart={handleReadyToStart} />;

      case 'scenario_prompt':
        return (
          <Step7ScenarioPrompt
            questionNumber={targetQIdx + 1}
            questionText={QUESTIONS[targetQIdx]?.text}
            onStartRecording={handleStartScenarioRecording}
          />
        );

      case 'recording':
        return (
          <Step5Recording
            questionNumber={targetQIdx + 1}
            totalQuestions={QUESTIONS.length}
            questionText={QUESTIONS[targetQIdx]?.text}
            onStopRecording={handleStopRecording}
          />
        );

      case 'review_single': {
        const currentResponse = recordedResponses[targetQIdx];
        const activeVideoUrl =
          currentResponse?.videoUrl ||
          currentResponse?.previewUrl ||
          videoService.getVideoUrl(token, targetQIdx + 1);

        return (
          <Step6ReviewQuestion
            questionNumber={targetQIdx + 1}
            duration={currentResponse?.duration || '0:11'}
            videoUrl={activeVideoUrl}
            onRetake={handleRetakeSingle}
            onContinue={handleContinueAfterReview}
          />
        );
      }

      case 'all_review': {
        const mappedResponses = recordedResponses.map((r) => ({
          ...r,
          videoUrl: r.videoUrl || r.previewUrl || videoService.getVideoUrl(token, r.questionNumber)
        }));

        return (
          <Step8AllResponsesReview
            responses={mappedResponses}
            isUploading={
              uploadingQuestion !== null ||
              mappedResponses.some((r) => r.uploadStatus === 'uploading')
            }
            onRetakeQuestion={handleRetakeFromAllReview}
            onFinish={handleFinishAll}
          />
        );
      }

      case 'feedback':
        return <Step9Feedback onComplete={handleFeedbackComplete} />;

      case 'already_completed':
        return <Step11AlreadyCompleted />;

      case 'invalid':
        return <Step12InvalidLink />;

      default:
        return <Step1LanguageSelection onContinue={handleLanguageContinue} />;
    }
  };

  if (effectiveStep === 'invalid') {
    return <Step12InvalidLink />;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F8F6F1]">
      <VerificationContainer
        header={true}
        onSelectLanguage={handleSelectLanguage}
        onChangeLanguage={() => {
          goToStep('language');
        }}
        totalSteps={5}
        currentStep={getStepProgress()}
        isLanguageScreen={effectiveStep === 'language'}
        isAlreadyCompletedScreen={effectiveStep === 'already_completed'}
      >
        {renderCurrentScreen()}
      </VerificationContainer>

      {/* Discreet Developer Step Switcher for QA and Screenshot Testing */}
      {/* <div className="fixed bottom-3 right-3 z-50">
        <button
          type="button"
          onClick={() => setShowDevControls(!showDevControls)}
          className="bg-neutral-900/80 hover:bg-neutral-900 text-white text-[11px] font-sans px-3 py-1.5 rounded-full shadow-md border border-neutral-700/80 backdrop-blur-sm flex items-center space-x-1.5 cursor-pointer"
        >
          <span>Screens</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        </button>

        {showDevControls && (
          <div className="absolute bottom-10 right-0 w-64 bg-neutral-950/95 text-white p-3 rounded-2xl border border-neutral-800 shadow-2xl space-y-1 text-xs max-h-[70vh] overflow-y-auto">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider pb-1 border-b border-neutral-800">
              Switch Screen:
            </div>
            {[
              { id: 'language', label: '1. Language Selection' },
              { id: 'instructions', label: '2. Instructions & Role' },
              { id: 'permissions', label: '3. Grant Permissions' },
              { id: 'ready', label: '4. Ready & Quick Tips' },
              { id: 'scenario_prompt', label: '5. Scenario Q1 Prompt', q: 1 },
              { id: 'recording', label: '6. Recording Q1 Viewfinder', q: 1 },
              { id: 'review_single', label: '7. Review Saved Q1', q: 1 },
              { id: 'scenario_prompt', label: '8. Scenario Q2 Prompt', q: 2 },
              { id: 'recording', label: '9. Recording Q2 Viewfinder', q: 2 },
              { id: 'review_single', label: '10. Review Saved Q2', q: 2 },
              { id: 'scenario_prompt', label: '11. Scenario Q3 Prompt', q: 3 },
              { id: 'recording', label: '12. Recording Q3 Viewfinder', q: 3 },
              { id: 'review_single', label: '13. Review Saved Q3', q: 3 },
              { id: 'all_review', label: '14. All 3 Answers Review' },
              { id: 'feedback', label: '15. Feedback & Next Steps' },
              { id: 'already_completed', label: '16. Assessment Taken' },
              { id: 'invalid', label: '17. Invalid Link' }
            ].map((s, idx) => (
              <button
                key={`${s.id}-${s.q || idx}`}
                type="button"
                onClick={() => {
                  if (s.q) setCurrentQuestionIndex(s.q - 1);
                  goToStep(s.id, s.q);
                  setShowDevControls(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer ${
                  effectiveStep === s.id && (s.q ? targetQIdx === s.q - 1 : true)
                    ? 'bg-[#FF5723] text-white font-semibold'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default VerificationFlow;
