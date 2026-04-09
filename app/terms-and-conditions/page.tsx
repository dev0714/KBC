'use client'

import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/navigation/footer'

export default function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="container mx-auto max-w-3xl text-center">
            <h1 className="mb-4">Terms and Conditions</h1>
            <p className="text-lg text-muted-foreground">
              Last updated: 29.01.2026
            </p>
          </div>
        </section>

        {/* Terms and Conditions Content */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
              
              {/* Introduction */}
              <div>
                <p>
                  These Terms and Conditions govern the use of the Kbc Brake and Clutch website and the purchase of products from our online store. By accessing our website or placing an order, you agree to these Terms and Conditions.
                </p>
                <p>
                  If you do not agree, please do not use this website.
                </p>
              </div>

              {/* Company Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Company Information</h2>
                <p>This website is operated by:</p>
                <div className="bg-card/30 p-4 rounded-lg border border-accent/20 mt-3">
                  <p className="font-semibold text-foreground">Kbc Brake and Clutch</p>
                  <p>South Africa</p>
                </div>
              </div>

              {/* Use of the Website */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Use of the Website</h2>
                <p className="mb-4">You agree to use this website only for lawful purposes. You must not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Misuse or interfere with the website</li>
                  <li>Attempt to gain unauthorised access to any part of the site</li>
                  <li>Use the website in a way that may harm Kbc Brake and Clutch or other users</li>
                </ul>
                <p className="mt-4">
                  We may suspend or terminate access if these terms are violated.
                </p>
              </div>

              {/* Product Information */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Product Information</h2>
                <p>We make every effort to ensure product descriptions, images, and prices are accurate. However:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Images are for illustration purposes only</li>
                  <li>Product availability may change without notice</li>
                  <li>Errors may occur, and we reserve the right to correct them</li>
                </ul>
              </div>

              {/* Pricing and Payment */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Pricing and Payment</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All prices are displayed in South African Rand (ZAR)</li>
                  <li>Prices may change without notice</li>
                  <li>Payment must be made in full before orders are processed</li>
                  <li>Online payments are handled by secure third-party payment providers</li>
                  <li>Kbc Brake and Clutch does not store card or banking details</li>
                </ul>
              </div>

              {/* Orders and Acceptance */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Orders and Acceptance</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Placing an order does not guarantee acceptance</li>
                  <li>We reserve the right to cancel or refuse any order</li>
                  <li>If an order is cancelled, any payment received will be refunded</li>
                </ul>
              </div>

              {/* Delivery */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Delivery</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Delivery times are estimates and may vary</li>
                  <li>We are not responsible for delays caused by couriers or events beyond our control</li>
                  <li>Risk passes to the customer once the order has been delivered</li>
                </ul>
              </div>

              {/* Returns and Refunds */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Returns and Refunds</h2>
                <p className="mb-4">Returns and refunds are handled in accordance with the Consumer Protection Act (CPA).</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Products must be returned in original condition and packaging</li>
                  <li>Certain items may not be eligible for return</li>
                  <li>Proof of purchase is required</li>
                  <li>Please contact us before returning any item</li>
                </ul>
              </div>

              {/* Vehicle Compatibility */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Vehicle Compatibility</h2>
                <p>
                  It is the customer's responsibility to ensure that the correct brake or clutch part is ordered for the vehicle. Kbc Brake and Clutch is not responsible for incorrect orders due to wrong vehicle or part information provided by the customer.
                </p>
              </div>

              {/* Warranty */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Warranty</h2>
                <p>
                  Products may carry a manufacturer's warranty where applicable. Warranty claims are subject to the manufacturer's terms and conditions.
                </p>
              </div>

              {/* Limitation of Liability */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
                <p>To the extent permitted by law:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Kbc Brake and Clutch is not liable for indirect or consequential damages</li>
                  <li>Our liability is limited to the value of the product purchased</li>
                  <li>Nothing in these terms limits rights under the Consumer Protection Act</li>
                </ul>
              </div>

              {/* Privacy and POPIA */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Privacy and POPIA</h2>
                <p>
                  Your personal information is collected and processed in accordance with the Protection of Personal Information Act (POPIA) and our Privacy Policy.
                </p>
                <p className="mt-4">
                  By using this website and placing an order, you consent to such processing.
                </p>
              </div>

              {/* Intellectual Property */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Intellectual Property</h2>
                <p>
                  All content on this website, including text, images, logos, and designs, belongs to Kbc Brake and Clutch and may not be used without written permission.
                </p>
              </div>

              {/* Governing Law */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
                <p>
                  These Terms and Conditions are governed by the laws of the Republic of South Africa.
                </p>
              </div>

              {/* Changes to These Terms */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Changes to These Terms</h2>
                <p>
                  We may update these Terms and Conditions at any time. Changes will be posted on this page.
                </p>
              </div>

              {/* Contact Details */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Details</h2>
                <p className="mb-4">
                  If you have any questions about these Terms and Conditions, please contact us:
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
