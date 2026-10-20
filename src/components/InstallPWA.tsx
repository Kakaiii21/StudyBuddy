import { useState } from 'react';
import { useInstallPWA } from '../hooks/useInstallPWA';

const InstallPWA = () => {
  const { isInstallable, installApp, isIOS, isStandalone, isMacSafari } = useInstallPWA();
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || dismissed) return null;

  if (isInstallable) {
    return (
        <>
     <hr className='lg:hidden md:hidden w-full border-t border-primary-600 mb-5 mt-3' />
      <div className="flex items-center justify-between gap-2 mt-4 px-4 py-3 border-2 border-primary-600 rounded-xl bg-white">
        <span className="text-sm text-primary-600 font-semibold">Install Study Buddy</span>
        <div className="flex gap-2">
          <button
            onClick={installApp}
            className="bg-primary-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
          >
            Install
          </button>

        </div>
      </div>
      </>
    );
  }

  if (isIOS) {
    return (
       <>
       <hr className='lg:hidden md:hidden w-full border-t border-primary-600 mb-5 mt-3' />
      <div className="flex items-center justify-between gap-2 mt-4 px-4 py-3 border-2 border-primary-600 rounded-xl bg-white">
        <span className="text-sm text-primary-600 font-semibold">
           Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-primary-600 font-bold text-sm px-2"
        >
          ✕
        </button>
      </div>
      </>
    );
  }

  if (isMacSafari) {
    return (
       <>
       <hr className='lg:hidden md:hidden w-full border-t border-primary-600 mb-5 mt-3' />
      <div className="flex items-center justify-between gap-2 mt-4 px-4 py-3 border-2 border-primary-600 rounded-xl bg-white">
        <span className="text-sm text-primary-600 font-semibold">
           Install via <strong>File</strong> → <strong>Add to Dock</strong>
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-primary-600 font-bold text-sm px-2"
        >
          ✕
        </button>
      </div>
      </>
    );
  }

  return null;
};

export default InstallPWA;