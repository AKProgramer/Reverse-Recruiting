export default function PrivacyPolicy() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h1 className="display-5 fw-bold text-primary mb-4">Privacy Policy for Reverse Recruiting</h1>
              
              <p className="lead text-muted mb-4">
                <strong>Effective Date:</strong> October 1, 2025
              </p>

              <div className="mb-4">
                <p>
                  Welcome to Reverse Recruiting. Your privacy is important to me, and I am committed to protecting 
                  the information you share while using this app. This Privacy Policy explains what data is collected, 
                  how it is used, and how you remain in control.
                </p>
              </div>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">1. Information I Collect</h2>
                <p>When you use Reverse Recruiting, the app may access:</p>
                <ul className="list-unstyled ms-3">
                  <li className="mb-2">
                    <i className="fas fa-user text-primary me-2"></i>
                    <strong>Google Account Information</strong> – such as your name and email address (for authentication only).
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-table text-primary me-2"></i>
                    <strong>Google Drive & Google Sheets Data</strong> – the app stores scraped or uploaded data into your Google Drive or Google Sheets as part of its core functionality.
                  </li>
                </ul>
                <p className="text-muted fst-italic">No other personal information is collected.</p>
              </section>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">2. How Your Data Is Used</h2>
                <p>Your data is used only for the following purposes:</p>
                <ul className="list-unstyled ms-3">
                  <li className="mb-2">
                    <i className="fas fa-sign-in-alt text-success me-2"></i>
                    To let you sign in securely with Google.
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-file-spreadsheet text-success me-2"></i>
                    To create and manage spreadsheets in your Google Sheets.
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-cloud text-success me-2"></i>
                    To save scraped or processed data into your Google Drive.
                  </li>
                </ul>
                <div className="alert alert-info">
                  <i className="fas fa-shield-alt me-2"></i>
                  <strong>Your data is never sold, rented, or shared with third parties.</strong>
                </div>
              </section>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">3. Google API Services Compliance</h2>
                <p>
                  Reverse Recruiting's use of Google Drive and Sheets strictly follows the{" "}
                  <a 
                    href="https://developers.google.com/terms/api-services-user-data-policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-none"
                  >
                    Google API Services User Data Policy
                  </a>, including the Limited Use requirements. This means your data is only used within the app to provide the features you requested.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">4. Data Security</h2>
                <p>
                  I take reasonable steps to keep your data safe from unauthorized access or misuse. However, 
                  since the data is stored in your own Google Drive and Sheets, you also remain in full control of it.
                </p>
              </section>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">5. Your Choices and Rights</h2>
                <p>You have full control of your Google account permissions. At any time, you can:</p>
                <ul className="list-unstyled ms-3">
                  <li className="mb-2">
                    <i className="fas fa-times-circle text-warning me-2"></i>
                    Revoke Reverse Recruiting's access via your{" "}
                    <a 
                      href="https://myaccount.google.com/permissions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-decoration-none"
                    >
                      Google Account Permissions
                    </a>.
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-trash text-danger me-2"></i>
                    Request that your data be deleted from the app's systems by contacting me.
                  </li>
                </ul>
              </section>

              <section className="mb-5">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">6. Changes to This Policy</h2>
                <p>
                  If this Privacy Policy is updated, the latest version will always be available at this page.
                  We will notify users of any material changes via email or through the application.
                </p>
              </section>

              <section className="mb-4">
                <h2 className="h3 text-primary border-bottom pb-2 mb-3">7. Contact</h2>
                <p>If you have questions or concerns about this Privacy Policy, please reach out:</p>
                <div className="card bg-light p-3">
                  <p className="mb-0">
                    <i className="fas fa-envelope text-primary me-2"></i>
                    <strong>Ali Hassan</strong> – 
                    <a href="mailto:contact@reverserecruiting.com" className="text-primary text-decoration-none ms-1">
                      ancillacorporation@gmail.com
                    </a>
                  </p>
                </div>
              </section>

              <div className="text-center mt-5">
                <a href="/" className="btn btn-primary">
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}