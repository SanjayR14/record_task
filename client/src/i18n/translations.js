/**
 * Language configuration & English source strings.
 * All non-English languages (hi, ta, te, kn, ml) are dynamically translated at runtime via Groq AI (/api/translate).
 */

export const LANGUAGES = [
  { id: 'en', code: 'A', name: 'English', sub: 'English', ttsLang: 'en-US' },
  { id: 'hi', code: 'अ', name: 'हिन्दी', sub: 'Hindi', ttsLang: 'hi-IN' },
  { id: 'ta', code: 'அ', name: 'தமிழ்', sub: 'Tamil', ttsLang: 'ta-IN' },
  { id: 'te', code: 'అ', name: 'తెలుగు', sub: 'Telugu', ttsLang: 'te-IN' },
  { id: 'kn', code: 'ಅ', name: 'ಕನ್ನಡ', sub: 'Kannada', ttsLang: 'kn-IN' },
  { id: 'ml', code: 'അ', name: 'മലയാളം', sub: 'Malayalam', ttsLang: 'ml-IN' }
];

export const getLanguageConfig = (langCodeOrName = 'en') => {
  const normalized = (langCodeOrName || 'en').toString().trim().toLowerCase();
  return (
    LANGUAGES.find(
      (l) =>
        l.id === normalized ||
        l.name.toLowerCase() === normalized ||
        l.sub.toLowerCase() === normalized
    ) || LANGUAGES[0]
  );
};

export const formatTemplate = (template = '', vars = {}) => {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    String(template)
  );
};

/**
 * Single English source dictionary dynamically translated by Groq when another language is selected.
 */
export const ENGLISH_STRINGS = {
  'common.continue': 'Continue',
  'common.readAgain': 'Read again',
  'common.listen': 'Listen',
  'common.stopReading': 'Stop reading',
  'common.finish': 'Finish',
  'common.retakeVideo': 'Retake video',
  'common.gotItSaved': 'Got it, saved.',
  'common.scenarioLabel': 'SCENARIO',
  'common.yourAnswer': 'your answer',
  'common.questionOf': 'Question {{q}} of {{total}}',

  'header.changeLanguage': 'Change Language',
  'header.needHelp': 'Need Help',
  'header.languageModalTitle': 'Select Language',
  'header.languageModalSubtitle': 'Choose your preferred language for the verification process.',
  'header.supportTitle': 'Candidate Support',
  'header.supportHeading': 'Need help with your verification?',
  'header.supportBody1': 'Make sure you have allowed camera, microphone, and location permissions in your mobile or desktop browser.',
  'header.supportBody2': 'For technical issues or link expiration, contact your Quess Corp recruiter directly on WhatsApp.',
  'header.backToVerification': 'Back to Verification',
  'header.close': 'Close',

  'step1.greeting': "Hi! I'm your verification guide from Record.",
  'step1.questionFull': 'Which language would you like to continue in?',
  'step1.selectLanguage': 'Select language',

  'step2.selectedLanguageLabel': 'Selected language',
  'step2.continuingIn': 'Got it, continuing in {{langName}}.',
  'step2.termsSentence': "By continuing, you agree to Record's {{terms}} and {{privacy}}. We'll access your camera, microphone, and device location to verify your identity and ensure authentic responses.",
  'step2.termsWord': 'Terms',
  'step2.privacyWord': 'Privacy Policy',
  'step2.roleSpeech': "Record is hiring for the Warehouse Picker role, and we'd like to see how you actually handle real work situations before deciding.",
  'step2.formatSpeech': "This isn't a test with right or wrong answers. It's 3 quick questions about situations you'd actually face on the job. You just explain what you'd do, in your own words, on video.",
  'step2.durationSpeech': "Takes about 5 to 10 minutes. Your recruiter at Quess Corp will personally watch your answers, that's it, nobody else sees this.",
  'step2.privacySpeech': "Your camera and mic are only used for these 3 questions. Nothing is recorded before or after, and this chat only works for this one verification.",

  'step3.promptSpeech': "Okay... I think you are ready now. Before we start, I'll need your camera, mic, and location, that's how we'll record and verify your video answers.",
  'step3.accessRequired': 'Access required',
  'step3.camera': 'Camera',
  'step3.microphone': 'Microphone',
  'step3.location': 'Location',
  'step3.detectingPin': 'Detecting accurate PIN code...',
  'step3.pinLabel': 'PIN',
  'step3.badges.granted': 'Allowed',
  'step3.badges.requesting': 'Requesting...',
  'step3.badges.denied': 'Denied',
  'step3.badges.unavailable': 'Unavailable',
  'step3.badges.required': 'Required',
  'step3.permissionRequiredTitle': 'Permission Required',
  'step3.permissionHint': 'If previously blocked, click the lock or camera icon in your browser address bar to allow permissions, then click Retry below.',
  'step3.retryAccess': 'Retry Permission Access',
  'step3.requestingAccess': 'Requesting access...',
  'step3.permissionsGranted': 'Permissions Granted',
  'step3.grantAccess': 'Grant Access',
  'step3.listenPromptHint': 'Please listen to the instructions above to continue',

  'step4.camMicOn': 'Camera and mic are on.',
  'step4.allSet': "You're all set.",
  'step4.quickTipTitle': 'Quick tip before we start:',
  'step4.tip1': 'Find some good lighting',
  'step4.tip2': 'Hold your phone steady',
  'step4.tip3': 'Speak naturally, just the way you do',
  'step4.readSpeech': "Camera and mic are on. You're all set. Quick tips: Find some good lighting, hold your phone steady, and speak naturally, just the way you do.",
  'step4.readyButton': "I'm Ready to Start",

  'step7.firstSituation': "Here's your first situation.",
  'step7.nextSituation': "Here's your next situation.",
  'step7.finalSituation': "Here's your final situation.",
  'step7.startRecordingBtn': 'I understand — Start recording',
  'step7.q1': 'A CNC program that produced correct parts yesterday is now making parts that are 2mm too short in one dimension. The material batch and machine settings are the same. What is the most likely cause you would investigate first in the program?',
  'step7.q2': "You arrive at a home where the kitchen sink is leaking from the faucet base. The homeowner says it's been dripping for two days. What's your first step to diagnose and fix this issue?",
  'step7.q3': 'You notice a critical warehouse shelf barcode label is torn and the scanner cannot read it during peak picking hours. Describe your immediate steps to fulfill the order without causing inventory discrepancy.',

  'step5.stopRecording': 'Stop Recording',

  'step6.retakeHint': 'You can retake anytime before you submit',
  'step6.savedBubble': "Your response for Scenario Q{{q}} has been saved. If you'd like to retry, simply click the Retake button below the video.",
  'step6.continueNext': 'Continue to Next Scenario',
  'step6.reviewAll': 'Review All Responses',

  'step8.allSavedBubble': 'Your responses for Scenario Q1, Q2, and Q3 have been saved.',
  'step8.retryBubble': 'To retry, click the Retake button below the video.',
  'step8.finishBubble': 'If you are good to go, please click on finish and complete your verification.',

  'step9.completedBubble': "That's it, all three answers are in. Thank you for taking the time to do this properly.",
  'step9.happensNowTitle': "Here's what happens now:",
  'step9.happensNow1': 'Your recruiter at Quess Corp will watch your answers',
  'step9.happensNow2': "They'll match your responses to what the Warehouse Picker role needs",
  'step9.happensNow3': "You'll hear back if you are selected",
  'step9.closeChatBubble': "You can close this chat now, we've got everything we need. Good luck.",
  'step9.howWasThis': 'How was this?',
  'step9.feedbackDesc': 'Quick feedback helps us make this easier for the next person.',
  'step9.feedbackPlaceholder': 'Anything that was confusing or difficult?',
  'step9.submitFeedback': 'Submit feedback',
  'step9.notNow': 'Not now',
  'step9.thanksTitle': 'Thanks for sharing!',
  'step9.thanksDesc': 'Thanks for taking the time. Your feedback helps us improve this for the next person.',
  'step9.done': 'Done',

  'step11.banner': 'Assessment already taken',
  'step11.body': 'You have already completed this verification assessment. Your responses are currently under review.',
  'step11.nextTitle': 'What to do next?',
  'step11.nextBody': 'Wait for the recruiter to reach out with the results. If you believe this is a mistake, please contact your recruiter directly.',
  'step11.closeWindow': 'You may now safely close this window.',

  'step12.title': 'Invalid link',
  'step12.body': "This link doesn't look right. Please use the link sent to your WhatsApp number.",
  'step12.closeWindow': 'You may now safely close this window.'
};

/**
 * Builds the structured `t` UI object from a dynamically translated flat dictionary.
 */
export const buildUiTranslations = (flat = ENGLISH_STRINGS) => {
  const s = { ...ENGLISH_STRINGS, ...flat };
  return {
    common: {
      continue: s['common.continue'],
      readAgain: s['common.readAgain'],
      listen: s['common.listen'],
      stopReading: s['common.stopReading'],
      finish: s['common.finish'],
      retakeVideo: s['common.retakeVideo'],
      gotItSaved: s['common.gotItSaved'],
      scenarioLabel: s['common.scenarioLabel'],
      yourAnswer: s['common.yourAnswer'],
      questionOf: (q, total) => formatTemplate(s['common.questionOf'], { q, total })
    },
    header: {
      changeLanguage: s['header.changeLanguage'],
      needHelp: s['header.needHelp'],
      languageModalTitle: s['header.languageModalTitle'],
      languageModalSubtitle: s['header.languageModalSubtitle'],
      supportTitle: s['header.supportTitle'],
      supportHeading: s['header.supportHeading'],
      supportBody1: s['header.supportBody1'],
      supportBody2: s['header.supportBody2'],
      backToVerification: s['header.backToVerification'],
      close: s['header.close']
    },
    step1: {
      greeting: s['step1.greeting'],
      questionFull: s['step1.questionFull'],
      selectLanguage: s['step1.selectLanguage']
    },
    step2: {
      selectedLanguageLabel: s['step2.selectedLanguageLabel'],
      continuingIn: (langName) => formatTemplate(s['step2.continuingIn'], { langName }),
      termsSentence: s['step2.termsSentence'],
      termsWord: s['step2.termsWord'],
      privacyWord: s['step2.privacyWord'],
      roleSpeech: s['step2.roleSpeech'],
      formatSpeech: s['step2.formatSpeech'],
      durationSpeech: s['step2.durationSpeech'],
      privacySpeech: s['step2.privacySpeech']
    },
    step3: {
      promptSpeech: s['step3.promptSpeech'],
      accessRequired: s['step3.accessRequired'],
      camera: s['step3.camera'],
      microphone: s['step3.microphone'],
      location: s['step3.location'],
      detectingPin: s['step3.detectingPin'],
      pinLabel: s['step3.pinLabel'],
      badges: {
        granted: s['step3.badges.granted'],
        requesting: s['step3.badges.requesting'],
        denied: s['step3.badges.denied'],
        unavailable: s['step3.badges.unavailable'],
        required: s['step3.badges.required']
      },
      permissionRequiredTitle: s['step3.permissionRequiredTitle'],
      permissionHint: s['step3.permissionHint'],
      retryAccess: s['step3.retryAccess'],
      requestingAccess: s['step3.requestingAccess'],
      permissionsGranted: s['step3.permissionsGranted'],
      grantAccess: s['step3.grantAccess'],
      listenPromptHint: s['step3.listenPromptHint']
    },
    step4: {
      camMicOn: s['step4.camMicOn'],
      allSet: s['step4.allSet'],
      quickTipTitle: s['step4.quickTipTitle'],
      tips: [s['step4.tip1'], s['step4.tip2'], s['step4.tip3']],
      readSpeech: s['step4.readSpeech'],
      readyButton: s['step4.readyButton']
    },
    step7: {
      firstSituation: s['step7.firstSituation'],
      nextSituation: s['step7.nextSituation'],
      finalSituation: s['step7.finalSituation'],
      startRecordingBtn: s['step7.startRecordingBtn'],
      questions: [s['step7.q1'], s['step7.q2'], s['step7.q3']]
    },
    step5: {
      stopRecording: s['step5.stopRecording']
    },
    step6: {
      retakeHint: s['step6.retakeHint'],
      savedBubble: (q) => formatTemplate(s['step6.savedBubble'], { q }),
      continueNext: s['step6.continueNext'],
      reviewAll: s['step6.reviewAll']
    },
    step8: {
      allSavedBubble: s['step8.allSavedBubble'],
      retryBubble: s['step8.retryBubble'],
      finishBubble: s['step8.finishBubble']
    },
    step9: {
      completedBubble: s['step9.completedBubble'],
      happensNowTitle: s['step9.happensNowTitle'],
      happensNow1: s['step9.happensNow1'],
      happensNow2: s['step9.happensNow2'],
      happensNow3: s['step9.happensNow3'],
      closeChatBubble: s['step9.closeChatBubble'],
      howWasThis: s['step9.howWasThis'],
      feedbackDesc: s['step9.feedbackDesc'],
      feedbackPlaceholder: s['step9.feedbackPlaceholder'],
      submitFeedback: s['step9.submitFeedback'],
      notNow: s['step9.notNow'],
      thanksTitle: s['step9.thanksTitle'],
      thanksDesc: s['step9.thanksDesc'],
      done: s['step9.done']
    },
    step11: {
      banner: s['step11.banner'],
      body: s['step11.body'],
      nextTitle: s['step11.nextTitle'],
      nextBody: s['step11.nextBody'],
      closeWindow: s['step11.closeWindow']
    },
    step12: {
      title: s['step12.title'],
      body: s['step12.body'],
      closeWindow: s['step12.closeWindow']
    }
  };
};

export const getTranslations = () => buildUiTranslations(ENGLISH_STRINGS);
