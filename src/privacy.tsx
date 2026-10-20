import { useNavigate } from "react-router-dom";
interface PrivacyPolicyProps {
  hideButton?: boolean;
}
function PrivacyPolicy({ hideButton = false }: PrivacyPolicyProps) {
  const navigate = useNavigate()

  return (
    <div className="max-w-5xl mx-auto px-2 py-1">

      <h1 className="text-4xl text-center font-bold   dark:text-white text-gray-900 mb-2 lg:text-2xl 2xl:text-3xl 3xl:text-4xl">
        Privacy Policy
      </h1>

      <p className="text-gray-500 text-center mb-8 lg:text-xs 2xl:text-sm 3xl:text-md ">
        Last Updated: June 2026
      </p>
      <hr className='w-full border-t mb-2 border-primary-600 ' />

      <div className="space-y-8 text-gray-700 mx-5 leading-relaxed ">
        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white ">1. Introduction</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            Study Buddy ("we", "our", or "us") respects your privacy and is
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, store, and protect your
            information when you use Study Buddy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white ">2. Information We Collect</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">We may collect the following information:</p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li>Name and email address</li>
            <li>Authentication information</li>
            <li>Notes, schedules, tasks, and study materials</li>
            <li>Files uploaded by users</li>
            <li>Device and browser information</li>
            <li>Usage and performance data</li>
            <li>Temporary email change tokens for account recovery purposes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">3. How We Use Your Information</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">We use collected information to:</p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li>Provide and maintain the Service</li>
            <li>Authenticate user accounts</li>
            <li>Generate study materials from uploaded files</li>
            <li>Store and synchronize your data</li>
            <li>Improve performance and user experience</li>
            <li>Provide customer support</li>
            <li>Maintain security and prevent abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">4. AI-Generated Study Materials</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            Study Buddy uses artificial intelligence to generate quizzes,
            flashcards, and study materials.
          </p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li>Generated content is based solely on files uploaded by the user.</li>
            <li>We do not retrieve external educational resources when generating study materials.</li>
            <li>Uploaded files may be processed temporarily to create study materials.</li>
            <li>Generated materials are intended for practice and review purposes only.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">5. Third-Party Services</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">We use trusted third-party providers to operate our Service:</p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li><strong>Firebase</strong> for authentication, database management, analytics, and hosting.</li>
            <li><strong>Cloudinary</strong> for cloud file storage and media delivery.</li>
          </ul>
          <p className="mt-3 lg:text-xs 2xl:text-sm 3xl:text-md">
            These providers may process information in accordance with their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">6. Data Storage and Security</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            We implement reasonable security measures to protect your data.
            However, no method of electronic storage or transmission over the
            internet can be guaranteed to be 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">7. Offline Access</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            As a Progressive Web Application (PWA), Study Buddy may store
            certain data locally on your device to support offline viewing of
            Notes, To-Do Lists, and Class Schedules. This locally stored data
            remains on your device until removed by you or your browser.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">8. Data Retention</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            We retain your information for as long as your account remains
            active or as necessary to provide our services, comply with legal
            obligations, resolve disputes, and enforce our agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">9. Your Rights</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">Depending on applicable laws, you may have the right to:</p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account and data</li>
            <li>Request a copy of your stored information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">10. Children's Privacy</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            Study Buddy is intended for students and educational use.
            Individuals under the age required by applicable laws should use
            the Service under the supervision of a parent, guardian, or
            educational institution where required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">11. Account Deletion</h2>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            Users may request deletion of their Study Buddy account at any time through
            the application settings or by contacting support.
          </p>
          <p className="mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">Upon account deletion:</p>
          <ul className="list-disc ml-6 space-y-2 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">
            <li>Your account information will be permanently removed.</li>
            <li>Your notes, schedules, tasks, and uploaded files may be deleted.</li>
            <li>AI-generated study materials associated with your account may be deleted.</li>
            <li>Certain information may be retained when required by law, security obligations, or legitimate business purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3 lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">12. Contact Us</h2>
          <p className="lg:text-xs 2xl:text-sm 3xl:text-md dark:text-white">If you have questions regarding this Privacy Policy, please contact us at:</p>
          <p className="mt-2 dark:text-white font-medium lg:text-xs 2xl:text-sm 3xl:text-md">support@studybuddyph.site</p>
        </section>

        <hr className='w-full border-t border-primary-600  ' />

        {!hideButton && (
          <section>
            <div className="flex justify-center">
              <button onClick={() => navigate(-1)}
                className="border text-sm font-roboto rounded-md text-white bg-green-500 px-6 py-2 uppercase hover:opacity-50"
                title="Go Back"
              >
                I Understand
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default PrivacyPolicy;