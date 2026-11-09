import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MessageSquare } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';
import recruiterIcon from '@/assets/Container.svg';
import matchIcon from '@/assets/Container (1).svg';
import callIcon from '@/assets/Container (2).svg';
import feedbackSvg from '@/assets/feedback.svg';
import { useVerification } from '@/context/VerificationContext';
import feedbackService from '@/services/feedbackService';

export const Step9Feedback = ({ onComplete }) => {
  const { token: routeToken } = useParams();
  const { token: contextToken, verificationData } = useVerification();
  const token = routeToken || contextToken;

  const storageKey = `record_${token || 'default'}_feedback_completed`;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Boolean flag to track if feedback has already been submitted or completed
  // Ensures feedback popup is only presented ONCE, and never again on refresh
  const [hasCompletedFeedback, setHasCompletedFeedback] = useState(() => {
    try {
      const stored =
        sessionStorage.getItem(storageKey) ||
        localStorage.getItem(storageKey) ||
        sessionStorage.getItem('record_feedback_completed');
      if (stored === 'true') return true;
    } catch (e) { }
    if (verificationData?.feedback?.rating || verificationData?.feedback?.submittedAt) {
      return true;
    }
    return false;
  });

  const markFeedbackAsCompleted = () => {
    setHasCompletedFeedback(true);
    try {
      sessionStorage.setItem(storageKey, 'true');
      localStorage.setItem(storageKey, 'true');
      sessionStorage.setItem('record_feedback_completed', 'true');
    } catch (e) { }
  };

  // Automatically show the first screen, and after a brief moment slide up the feedback popup
  // ONLY if feedback has not already been completed (single-use boolean guard)
  useEffect(() => {
    if (hasCompletedFeedback) {
      return;
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
      // Trigger smooth slide-up animation on next frame
      requestAnimationFrame(() => {
        setPopupVisible(true);
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [hasCompletedFeedback]);

  const handleDismiss = () => {
    markFeedbackAsCompleted();
    setPopupVisible(false);
    setTimeout(() => {
      setShowPopup(false);
    }, 400);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitted(true);
    markFeedbackAsCompleted();

    if (token && rating > 0) {
      try {
        await feedbackService.submitFeedback(token, { rating, comments });
      } catch (err) {
        console.warn('[Feedback] Backend submission error:', err.message);
      }
    }
  };

  const handleDone = () => {
    markFeedbackAsCompleted();
    handleDismiss();
    if (onComplete) onComplete({ rating, comments });
  };

  return (
    <div className="relative flex flex-col w-full space-y-4 pb-6">
      {/* Base Screen (Replicating exact design from Left Image 9) */}
      <div className="space-y-3.5">
        {/* Assistant Bubble 1: Completed Confirmation */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-1.5">
          <p className="text-medium sm:text-sm font-semibold text-slate-800 leading-snug">
            That's it, all three answers are in. Thank you for taking the time to do this properly.
          </p>
          <ReadAgainButton text="That's it, all three answers are in. Thank you for taking the time to do this properly." />
        </div>

        {/* Assistant Bubble 2: Here's what happens now (with 3 Figma Container SVG icons) */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-3">
          <p className="text-medium sm:text-sm font-bold text-slate-900">
            Here's what happens now:
          </p>

          <div className="space-y-3 pt-0.5">
            {/* Item 1: Recruiter watch */}
            <div className="flex items-center gap-3">
              <img src={recruiterIcon} alt="Recruiter" className="w-8 h-8 shrink-0 select-none" />
              <span class="font-sans font-medium text-[15px] leading-[22px] tracking-normal">
                Your recruiter at Quess Corp will watch your answers
              </span>
            </div>

            {/* Item 2: Match responses */}
            <div className="flex items-center gap-3">
              <img src={matchIcon} alt="Match responses" className="w-8 h-8 shrink-0 select-none" />
              <span class="!pt-4 font-sans font-medium text-[15px] leading-[22px] tracking-normal">
                They'll match your responses to what the <strong className="font-bold text-slate-950">Warehouse Picker</strong> role needs
              </span>
            </div>

            {/* Item 3: Hear back */}
            <div className="flex items-center gap-3">
              <img src={callIcon} alt="Hear back" className="w-8 h-8 shrink-0 select-none" />
              <span class="font-sans font-medium text-[15px] leading-[22px] tracking-normal">
                You'll hear back if you are selected
              </span>
            </div>
          </div>

          <ReadAgainButton text="Here's what happens now: Your recruiter at Quess Corp will watch your answers. They'll match your responses to what the Warehouse Picker role needs. You'll hear back if you are selected." />
        </div>

        {/* Assistant Bubble 3: Final sign-off */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/60 max-w-[92%] sm:max-w-[85%] space-y-1.5">
          <p className="text-medium sm:text-sm text-slate-800 leading-relaxed font-medium">
            You can close this chat now, we've got everything we need. Good luck.
          </p>
          <ReadAgainButton text="You can close this chat now, we've got everything we need. Good luck." />
        </div>
      </div>

      {/* Bottom to Top Feedback Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
          {/* Subtle dim backdrop */}
          <div
            onClick={handleDismiss}
            className={`fixed inset-0 duration-300 pointer-events-auto ${popupVisible ? 'opacity-100' : 'opacity-0'
              }`}
          />

          {/* Bottom Sheet Modal */}
          <div
            className={`relative z-10 w-full max-w-2xl mx-auto bg-white rounded-t-3xl p-5 pt-3 border-t border-neutral-100 transition-transform duration-500 ease-out pointer-events-auto ${popupVisible ? 'translate-y-0' : 'translate-y-full'
              }`}
          >
            {/* Top drag handle pill */}
            <div className="w-10 h-1 bg-[#E4E4E7] rounded-full mx-auto mb-3" />

            {!isSubmitted ? (
              /* State 1: Feedback Form (Screen 8) */
              <div className="space-y-3.5">
                {/* Header Row: Orange Chat Icon + Listen Button */}
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-6 h-6 text-[#FF5723]" strokeWidth={2.2} />
                  <ReadAgainButton
                    text="How was this? Quick feedback helps us make this easier for the next person."
                    label="Listen"
                  />
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-semibold text-[#FF5723]">
                    How was this?
                  </h3>
                  <p className="text-medium text-neutral-500 font-normal leading-relaxed">
                    Quick feedback helps us make this easier for the next person.
                  </p>
                </div>

                {/* 5-Star Rating Control */}
                <div className="flex pl-8 sm:justify-center gap-4 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors ${active
                            ? 'fill-[#FF5723] text-[#FF5723]'
                            : 'fill-transparent text-[#A1A1AA] stroke-[1.5]'
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Comments Textarea */}
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Anything that was confusing or difficult?"
                  rows={3}
                  className="w-full text-xs sm:text-sm pt-2 pl-2 rounded-xl border border-neutral-200 focus:border-[#FF5723] focus:ring-1 focus:ring-[#FF5723] outline-none resize-none text-slate-800 placeholder:text-neutral-400 bg-white"
                />

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
                  >
                    Submit feedback
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full py-2 text-xs sm:text-sm text-neutral-600 hover:text-neutral-900 font-medium text-center cursor-pointer transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
            ) : (
              /* State 2: After Feedback - Thanks for Sharing! (Exact match to uploaded image 2) */
              <div className="space-y-3 pt-1 pb-1 animate-fadeIn">
                {/* Concentric Green Checkmark SVG */}
                <div className="flex justify-center">
                  <img
                    src={feedbackSvg}
                    alt="Feedback received"
                    className="w-16 h-16 select-none"
                    draggable={false}
                  />
                </div>

                {/* Green Heading */}
                <h3 className="text-base sm:text-lg font-semibold text-[#16A34A] text-center">
                  Thanks for sharing!
                </h3>

                {/* Subtitle message */}
                <p className="text-sm sm:text-[13px] text-neutral-500 font-normal leading-relaxed max-w-xs mx-auto">
                  Thanks for taking the time. Your feedback helps us improve this for the next person.
                </p>

                {/* Done Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDone}
                    className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Step9Feedback;
