// src/context/HelpBuddyContext.tsx
import { useState, type ReactNode } from 'react'
import { HelpBuddyContext, useHelpBuddy } from './useHelpBuddy'

export function HelpBuddyProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <HelpBuddyContext.Provider
      value={{
        isOpen,
        openHelpModal: () => setIsOpen(true),
        closeHelpModal: () => setIsOpen(false),
      }}
    >
      {children}
      <HelpBuddyModal />
    </HelpBuddyContext.Provider>
  )
}

// Internal — not exported. Rendered automatically by the provider above,
// so consumers never need to mount this themselves.
function HelpBuddyModal() {
  const { isOpen, closeHelpModal } = useHelpBuddy()
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={closeHelpModal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-xs xl:max-w-sm 2xl:max-w-md 3xl:max-w-lg">
          <img
            src="/Bear.png"
            alt=""
            className="absolute -top-16 sm:-top-20 lg:-top-14 xl:-top-16 2xl:-top-20 3xl:-top-24 left-1/2 -translate-x-1/2 w-32 sm:w-40 lg:w-28 xl:w-32 2xl:w-40 3xl:w-48 z-10 select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
          <div className="relative bg-[#1A1A1A] border-2 border-[#FEE248] rounded-2xl pt-8 sm:pt-10 lg:pt-6 xl:pt-7 2xl:pt-9 3xl:pt-12 pb-5 sm:pb-6 lg:pb-4 xl:pb-5 2xl:pb-6 3xl:pb-8 px-5 sm:px-6 lg:px-4 xl:px-5 2xl:px-6 3xl:px-8">
            <button
              onClick={closeHelpModal}
              className="absolute top-3 right-4 text-white text-lg sm:text-xl lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl font-bold hover:opacity-70"
            >
              ×
            </button>
            <h2 className="text-center font-inter font-extrabold text-xl sm:text-2xl lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl text-white mb-3 sm:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 3xl:mb-5">
              HELP YOUR <span className="text-[#FEE248]">BUDDY!</span>
            </h2>
            <div className="flex justify-center mb-3 sm:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 3xl:mb-5">
              <img
                src="/helpIcons/qr-code.png"
                alt="Donation QR code"
                className="w-36 h-36 sm:w-44 sm:h-44 lg:w-32 lg:h-32 xl:w-36 xl:h-36 2xl:w-44 2xl:h-44 3xl:w-52 3xl:h-52 bg-gray-200 rounded-md object-contain"
              />
            </div>
            <p className="-mt-3 md:-mt-2 lg:-mt-2 xl:-mt-2 2xl:-mt-4 3xl:-mt-5  text-center font-inter font-bold text-[#FEE248] text-xs sm:text-sm lg:text-xs xl:text-xs 2xl:text-sm 3xl:text-base mb-1">
              CA**Y D.
            </p>
            <p className="text-center font-inter font-bold text-white text-xs sm:text-sm lg:text-xs xl:text-xs 2xl:text-sm 3xl:text-base mb-1">
              Want to help?
            </p>
            <p className="text-center font-inter text-white text-[11px] sm:text-xs lg:text-[10px] xl:text-[10px] 2xl:text-xs 3xl:text-sm leading-relaxed mb-3 sm:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 3xl:mb-5">
              You may scan the QR code to{' '}
              <span className="text-[#FEE248] font-semibold">give a voluntary contribution.</span>{' '}
              Your support will help us recover some of the expenses we incurred while developing this project
            </p>
            <div className="grid grid-cols-4 gap-2 lg:gap-1.5 xl:gap-1.5 2xl:gap-2 3xl:gap-3 mb-3 sm:mb-4 lg:mb-2 xl:mb-3 2xl:mb-4 3xl:mb-5">
              <div className="flex flex-col items-center text-center">
                <img src="/helpIcons/shield.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4 xl:w-4 xl:h-4 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 mb-1 select-none" draggable={false} />
                <p className="text-white text-[8px] sm:text-[9px] lg:text-[7px] xl:text-[7px] 2xl:text-[9px] 3xl:text-[10px] leading-tight">
                  This is a school capstone project, not a registered charity.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <img src="/helpIcons/wallet.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4 xl:w-4 xl:h-4 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 mb-1 select-none" draggable={false} />
                <p className="text-white text-[8px] sm:text-[9px] lg:text-[7px] xl:text-[7px] 2xl:text-[9px] 3xl:text-[10px] leading-tight">
                  it's not tax-deductible
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <img src="/helpIcons/lightning.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4 xl:w-4 xl:h-4 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 mb-1 select-none" draggable={false} />
                <p className="text-white text-[8px] sm:text-[9px] lg:text-[7px] xl:text-[7px] 2xl:text-[9px] 3xl:text-[10px] leading-tight">
                  Since transfers are instant,{' '}
                  <span className="text-[#FEE248]">we cant do refunds.</span>
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <img src="/helpIcons/lock.png" alt="" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-4 lg:h-4 xl:w-4 xl:h-4 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 mb-1 select-none" draggable={false} />
                <p className="text-white text-[8px] sm:text-[9px] lg:text-[7px] xl:text-[7px] 2xl:text-[9px] 3xl:text-[10px] leading-tight">
                  We never see or store your payment info - it all{' '}
                  <span className="text-[#FEE248]">stays safe</span> in GCash app!
                </p>
              </div>
            </div>
            <div className="bg-[#FEE248] rounded-full py-2 lg:py-1.5 xl:py-1.5 2xl:py-2 3xl:py-2.5 text-center">
              <p className="font-inter font-bold text-primary-800 text-xs sm:text-sm lg:text-[10px] xl:text-[10px] 2xl:text-sm 3xl:text-base">
                Thank you for your support! 🥹
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}