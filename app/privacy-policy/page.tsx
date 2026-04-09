'use client'

import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="mb-4">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: 29.01.2026
            </p>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
              
              {/* Introduction */}
              <div>
                <p>
                  Kbc Brake and Clutch ("we", "us", "our") respects your privacy and is committed to protecting your personal information in accordance with the Protection of Personal Information Act, 2013 (POPIA).
                </p>
                <p>
                  This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you visit or use our website and purchase products online.
                </p>
              </div>

              {/* Information We Collect */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
                <p className="mb-4">When you use our website, we may collect the following information:</p>
                
                <h3 className="text-lg font-semibold text-foreground mb-3">Personal Information:</h3>
                <ul className="list-disc list-inside space-y-2 mb-6 ml-4">
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Contact number</li>
                  <li>Billing and delivery address</li>
                  <li>Company name (if applicable)</li>
                  <li>Order and purchase history</li>
                  <li>Vehicle, brake, or clutch product information related to your order</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mb-3">Technical Information:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address</li>
                  <li>Browser type and device information</li>
                  <li>Pages visited on our website</li>
                </ul>
              </div>

              {/* How We Collect Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">How We Collect Information</h2>
                <p>We collect information when you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Place an order on our website</li>
                  <li>Create an account</li>
                  <li>Contact us via forms, email, or WhatsApp</li>
                  <li>Subscribe to updates or newsletters (if applicable)</li>
                  <li>Browse our website (through cookies)</li>
                </ul>
              </div>

              {/* How We Use Your Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process and deliver online orders</li>
                  <li>Communicate about orders, deliveries, or enquiries</li>
                  <li>Provide customer support</li>
                  <li>Improve website functionality and user experience</li>
                  <li>Comply with legal and regulatory requirements</li>
                </ul>
                <p className="mt-4">
                  We do not sell, rent, or trade your personal information.
                </p>
              </div>

              {/* Online Payments */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Online Payments</h2>
                <p>
                  All online payments are processed through secure third-party payment gateways. Kbc Brake and Clutch does not store or have access to your card or banking details.
                </p>
              </div>

              {/* Cookies and Tracking */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Cookies and Tracking Technologies</h2>
                <p>
                  Our website uses cookies to improve functionality and understand how visitors use the site. You can control or disable cookies through your browser settings. Disabling cookies may affect certain features of the website.
                </p>
              </div>

              {/* Sharing of Personal Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Sharing of Personal Information</h2>
                <p>We may share your personal information only where necessary, including with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Courier and delivery service providers</li>
                  <li>Payment service providers</li>
                  <li>Website hosting and IT service providers</li>
                  <li>Regulatory or legal authorities where required by law</li>
                </ul>
                <p className="mt-4">
                  All third parties are required to protect your information and use it only for the agreed purpose.
                </p>
              </div>

              {/* Protection of Personal Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Protection of Personal Information</h2>
                <p>
                  We implement reasonable technical and organisational security measures to safeguard your personal information against loss, unauthorised access, misuse, or disclosure, in compliance with POPIA.
                </p>
              </div>

              {/* Retention of Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Retention of Information</h2>
                <p>
                  We retain personal information only for as long as necessary to fulfil the purpose for which it was collected or as required by law.
                </p>
              </div>

              {/* Your Rights */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
                <p>In terms of POPIA, you have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Request correction or update of your information</li>
                  <li>Request deletion of your information where legally allowed</li>
                  <li>Object to the processing of your personal information</li>
                </ul>
                <p className="mt-4">
                  You may exercise these rights by contacting us using the details below.
                </p>
              </div>

              {/* Links to External Websites */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Links to External Websites</h2>
                <p>
                  Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.
                </p>
              </div>

              {/* Changes to this Privacy Policy */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Changes to this Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be published on this page.
                </p>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
                <p className="mb-4">
                  If you have any questions about this Privacy Policy or how we handle personal information, please contact us:
                </p>
                <div className="bg-card/30 p-6 rounded-lg border border-accent/20">
                  <p className="font-semibold text-foreground">Kbc Brake and Clutch</p>
                  <p className="mt-2">Email: <a href="mailto:info@kbcbrake.co.za" className="text-accent hover:underline">info@kbcbrake.co.za</a></p>
                  <p>Phone: <a href="tel:0114931336" className="text-accent hover:underline">011-493-1336</a></p>
                  <p>Address: 6 Stephenson Street, Wemmer, Johannesburg, Gauteng, South Africa</p>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
