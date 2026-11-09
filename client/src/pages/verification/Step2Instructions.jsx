import React from 'react';
import { Check } from 'lucide-react';
import ReadAgainButton from '@/components/common/ReadAgainButton';

/** White assistant bubble with a "Read again" row. `speech` is the plain text that gets read aloud. */
const Bubble = ({ children, speech }) => (
  <div className="bg-white rounded-xl px-4 py-3.5 max-w-[88%] sm:max-w-[80%] space-y-2">
    <p className="text-medium sm:text-base text-slate-900 leading-relaxed font-medium">{children}</p>
    <ReadAgainButton text={speech} />
  </div>
);

const B = ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>;

export const Step2Instructions = ({
  onContinue,
  selectedLanguage = { code: 'A', name: 'English', sub: 'English' },
}) => {
  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      <div className="space-y-3">
        {/* User reply – selected language (right aligned) */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs text-slate-500">Selected language</span>
          <div className="relative flex items-center gap-3 w-[62%] max-w-[260px] p-2.5 sm:p-3 rounded-xl bg-white border border-[#00A63E]">
            <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#EEF0F8] text-[#3B5BDB] flex items-center justify-center text-sm font-bold">
              {selectedLanguage.code}
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-tight truncate">
                {selectedLanguage.name}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight truncate">
                {selectedLanguage.sub}
              </span>
            </span>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#00A63E] text-white flex items-center justify-center ring-2 ring-[#F1EADF]">
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
          </div>
        </div>

        {/* Assistant 1 */}
        <Bubble speech="Got it, continuing in English.">
          Got it, continuing in <B>English</B>.
        </Bubble>

        {/* Terms notice */}
        <div className="mx-1 px-3 py-2.5 rounded-lg bg-[#FFF6CC] text-[10px] sm:text-[11px] text-[#6B5A1E] text-center leading-snug">
          By continuing, you agree to Record's{' '}
          <a href="#terms" className="underline font-medium text-[#2563EB]">Terms</a> and{' '}
          <a href="#privacy" className="underline font-medium text-[#2563EB]">Privacy Policy</a>. We'll access your
          camera, microphone, and device location to verify your identity and ensure authentic responses.
        </div>

        {/* Assistant 2 – role */}
        <Bubble speech="Record is hiring for the Warehouse Picker role, and we'd like to see how you actually handle real work situations before deciding.">
          Record is hiring for the <B>Warehouse Picker role</B>, and we'd like to see how you actually
          handle real work situations before deciding.
        </Bubble>

        {/* Assistant 3 – format */}
        <Bubble speech="This isn't a test with right or wrong answers. It's 3 quick questions about situations you'd actually face on the job. You just explain what you'd do, in your own words, on video.">
          This isn't a test with right or wrong answers. It's <B>3 quick questions</B> about situations
          you'd actually face on the job. You just explain what you'd do, in your own words, on video.
        </Bubble>

        {/* Assistant 4 – duration & recruiter */}
        <Bubble speech="Takes about 5 to 10 minutes. Your recruiter at Quess Corp will personally watch your answers, that's it, nobody else sees this.">
          Takes about <B>5 to 10 minutes</B>. Your recruiter at <B>Quess Corp</B> will personally watch
          your answers, that's it, nobody else sees this.
        </Bubble>

        {/* Assistant 5 – privacy */}
        <Bubble speech="Your camera and mic are only used for these 3 questions. Nothing is recorded before or after, and this chat only works for this one verification.">
          Your <B>camera and mic</B> are only used for these 3 questions. Nothing is recorded before or
          after, and this chat only works for this one verification.
        </Bubble>
      </div>

      {/* Continue */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 px-4 bg-[#FF5723] hover:bg-[#F4511E] active:bg-[#E64A19] text-white font-medium text-base rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5723]/60 focus-visible:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step2Instructions;