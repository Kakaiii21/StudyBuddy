import { useNavigate } from "react-router-dom";

interface TermsOfServiceProps {
  hideButton?: boolean;
}

function TermsOfService({ hideButton = false }: TermsOfServiceProps) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white dark:bg-[#010409] warm:bg-[#FBF1E8]">  

      <div className="max-w-5xl mx-auto px-2  py-1">
        <h1 className="text-4xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl  text-center font-bold text-gray-900 dark:text-white mb-2">
          Terms of Service
        </h1>

        <p className="text-gray-500 text-center lg:text-xs 2xl:text-sm 3xl:text-md  mb-8">
          Last Updated: June 2026
        </p>
          <hr className='w-full border-t mb-3 border-primary-600 ' />


        <div className="space-y-8 text-gray-700 mx-5 leading-relaxed">
          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              By accessing or using Study Buddy through{' '}
              <a
                href="https://studybuddyph.site"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                studybuddyph.site
              </a>
              , you agree to be bound by these Terms of Service. If you do not
              agree with these Terms, please discontinue use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              2. Description of Service
            </h2>
            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              Study Buddy is a Progressive Web Application (PWA) designed to
              help students organize and manage their studies.
            </p>

            <ul className="list-disc ml-6 lg:text-xs 2xl:text-sm 3xl:text-md space-y-2 dark:text-white">
              <li>Notes management</li>
              <li>To-do lists</li>
              <li>Class schedules</li>
              <li>AI-generated quizzes and flashcards</li>
              <li>Offline access to selected features</li>
              <li>Other educational productivity tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              3. User Accounts
            </h2>

            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </p>

            <ul className="list-disc ml-6 space-y-2 lg:text-xs dark:text-white 2xl:text-sm 3xl:text-md">
              <li>Provide accurate account information</li>
              <li>Keep your login credentials secure</li>
              <li>Report unauthorized account access immediately</li>
              <li>You have 7 days to undo an email address change after it is confirmed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              4. Acceptable Use
            </h2>

            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">You agree not to:</p>

            <ul className="list-disc ml-6 space-y-2 lg:text-xs dark:text-white 2xl:text-sm 3xl:text-md">
              <li>Use the Service for unlawful purposes</li>
              <li>Upload harmful, offensive, or malicious content</li>
              <li>Attempt unauthorized access to systems or accounts</li>
              <li>Disrupt or interfere with the Service</li>
              <li>Upload malware, viruses, or harmful code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              5. User Content
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              You retain ownership of content you upload, including notes,
              schedules, and study files. By uploading content, you grant Study
              Buddy a limited license to store, process, and display such
              content solely for providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              6. AI-Generated Study Materials
            </h2>

            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              Study Buddy uses artificial intelligence to generate quizzes,
              flashcards, and other study materials.
            </p>

            <ul className="list-disc ml-6 space-y-2 lg:text-xs dark:text-white 2xl:text-sm 3xl:text-md">
              <li>
                AI-generated materials are created only from files uploaded by
                the user.
              </li>
              <li>
                Study Buddy does not retrieve external educational resources for
                generating study materials.
              </li>
              <li>
                Generated content is intended for personal practice and review
                purposes only.
              </li>
              <li>
                Generated materials should not be used as official grading,
                academic evaluation, or educational certification.
              </li>
              <li>
                Users are responsible for verifying the accuracy of generated
                content.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              7. Offline Access
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              As a Progressive Web Application (PWA), Study Buddy may allow
              offline viewing of Notes, To-Do Lists, and Class Schedules.
              Offline functionality may vary depending on device capabilities
              and browser support.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              8. Third-Party Services
            </h2>

            <p className="mb- lg:text-xs 2xl:text-sm 3xl:text-md">
              Study Buddy relies on trusted third-party providers, including:
            </p>

            <ul className="list-disc ml-6 space-y-2 lg:text-xs dark:text-white 2xl:text-sm 3xl:text-md">
              <li>Firebase for authentication, database, and hosting</li>
              <li>Cloudinary for cloud-based file storage and media delivery</li>
            </ul>

            <p className="mt-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              Use of these services may also be subject to their respective
              terms and privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              9. Intellectual Property
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              All Study Buddy branding, logos, designs, source code, and other
              proprietary materials are owned by Study Buddy and may not be
              copied, modified, distributed, or reproduced without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              10. Disclaimer of Warranties
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              Study Buddy is provided on an "as is" and "as available" basis.
              We make no warranties regarding availability, reliability,
              accuracy, security, or fitness for a particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              11. Limitation of Liability
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              To the fullest extent permitted by law, Study Buddy shall not be
              liable for any indirect, incidental, consequential, or special
              damages arising from the use of the Service or reliance on
              AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              12. Account Termination and Deletion
            </h2>

            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              You may stop using the Service and request deletion of your account at any
              time.
            </p>

            <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              We reserve the right to suspend or terminate accounts that:
            </p>

            <ul className="list-disc ml-6 space-y-2 lg:text-xs dark:text-white 2xl:text-sm 3xl:text-md">
              <li>Violate these Terms of Service</li>
              <li>Engage in fraudulent or abusive activities</li>
              <li>Threaten the security or operation of the Service</li>
            </ul>

            <p className="mt-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              Upon account deletion or termination, access to your data and uploaded
              content may be permanently removed from our systems, subject to applicable
              legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              13. Changes to Terms
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              We may update these Terms of Service from time to time. Continued
              use of the Service after updates are posted constitutes acceptance
              of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl lg:text-xs 2xl:text-sm 3xl:text-md font-semibold mb-3">
              14. Contact Us
            </h2>

            <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              If you have questions regarding these Terms of Service, contact us
              at:
            </p>

            <p className="mt-2 font-medium lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
              support@studybuddyph.site
            </p>
          </section>
                    <hr className='w-full border-t border-primary-600 ' />

          {!hideButton && (
            <section>
              <div className="flex justify-center">
                <button onClick={() => navigate(-1)}
                  className="border text-sm font-roboto px-6 py-2 rounded-md text-white bg-green-500 uppercase hover:opacity-50"
                  title="Go Back"
                >
                  I Understand
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;