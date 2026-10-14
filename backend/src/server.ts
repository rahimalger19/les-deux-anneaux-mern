import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth.routes";
import catalogRoutes from "./routes/catalog.routes";
import bookingRoutes from "./routes/booking.routes";
import paymentRoutes from "./routes/payment.routes";
import documentRoutes from "./routes/document.routes";
import appointmentRoutes from "./routes/appointment.routes";
import quoteRoutes from "./routes/quote.routes";
import contactRoutes from "./routes/contact.routes";
import newsletterRoutes from "./routes/newsletter.routes";
import adminCommunicationRoutes from "./routes/admin-communication.routes";
import publicContentRoutes from "./routes/public-content.routes";
import galleryRoutes from "./routes/gallery.routes";
import reviewRoutes from "./routes/review.routes";
import partnerRoutes from "./routes/partner.routes";
import messageRoutes from "./routes/message.routes";
import galleryFavoriteRoutes from "./routes/gallery-favorite.routes";
import path from "path";
import guestListRoutes from "./routes/guest-list.routes";
import profileRoutes from "./routes/profile.routes";
import preferencesRoutes from "./routes/preferences.routes";
import supportTicketRoutes from "./routes/support-ticket.routes";
import localPayerRoutes from "./routes/local-payer.routes";
import securityRoutes from "./routes/security.routes";
import adminDashboardRoutes from "./routes/admin-dashboard.routes";
import adminAvailabilityRoutes from "./routes/admin-availability.routes";
import adminBookingRoutes from "./routes/admin-booking.routes";
import adminAppointmentRoutes from "./routes/admin-appointment.routes";
import adminClientRoutes from "./routes/admin-client.routes";
import adminReviewRoutes from "./routes/admin-review.routes";
import adminGalleryRoutes from "./routes/admin-gallery.routes";
import adminDayOfRoutes from "./routes/admin-day-of.routes";
import superDashboardRoutes from "./routes/super-dashboard.routes";
import superTeamRoutes from "./routes/super-team.routes";
import superPricingRoutes from "./routes/super-pricing.routes";
import superPackRoutes from "./routes/super-pack.routes";
import superCurrencyRoutes from "./routes/super-currency.routes";
import superPaymentConfigurationRoutes from "./routes/super-payment-configuration.routes";
import superEmailTemplateRoutes from "./routes/super-email-template.routes";
import superSmsRoutes from "./routes/super-sms.routes";
import superNewsletterRoutes from "./routes/super-newsletter.routes";
import superPartnerRoutes from "./routes/super-partner.routes";
import analyticsRoutes from "./routes/analytics.routes";
import superTrackingRoutes from "./routes/super-tracking.routes";
import { startMaintenanceJobs } from "./services/maintenance.service";
import superSystemRoutes from "./routes/super-system.routes";
import legalRoutes from "./routes/legal.routes";
import currencyRoutes from "./routes/currency.routes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin/communication", adminCommunicationRoutes);
app.use("/api/public", publicContentRoutes);
app.use("/api/public/legal", legalRoutes);
app.use("/api/currencies", currencyRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/gallery-favorites", galleryFavoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/guest-lists", guestListRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/local-payers", localPayerRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/availability", adminAvailabilityRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
app.use("/api/admin/clients", adminClientRoutes);
app.use("/api/admin/reviews", adminReviewRoutes);
app.use("/api/admin/gallery", adminGalleryRoutes);
app.use("/api/admin/day-of", adminDayOfRoutes);
app.use("/api/super/dashboard", superDashboardRoutes);
app.use("/api/super/team", superTeamRoutes);
app.use("/api/super/tarifs", superPricingRoutes);
app.use("/api/super/packs", superPackRoutes);
app.use("/api/super/devises", superCurrencyRoutes);
app.use("/api/super/marque", superPaymentConfigurationRoutes);
app.use("/api/super/smtp", superEmailTemplateRoutes);
app.use("/api/super/sms", superSmsRoutes);
app.use("/api/super/newsletter", superNewsletterRoutes);
app.use("/api/super/partenaires", superPartnerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/super/tracking", superTrackingRoutes);
app.use("/api/super/systeme", superSystemRoutes);


app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

const port = Number(process.env.PORT) || 5000;

connectDatabase()
  .then(() => {
    startMaintenanceJobs();
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  })
  .catch(console.error);