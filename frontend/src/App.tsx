import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ComponentProps } from "react";
import { AppProviders } from "./contexts/AppProviders";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/client/DashboardPage";
import HomePage from "./pages/public/HomePage";
import PublicLayout from "./components/layout/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import ServicesPage from "./pages/public/ServicesPage";
import PacksPricingPage from "./pages/public/PacksPricingPage";
import EventPage from "./pages/public/EventPage";
import ReservationPage from "./pages/public/ReservationPage";
import GuestTrackingPage from "./pages/public/GuestTrackingPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import RoleRoute from "./routes/RoleRoute";
import DocumentsPage from "./pages/client/DocumentsPage";
import BookingsPage from "./pages/client/BookingsPage";
import BookingDetailsPage from "./pages/client/BookingDetailsPage";
import ClientLayout from "./components/layout/ClientLayout";
import PaymentsPage from "./pages/client/PaymentsPage";
import ProofsPage from "./pages/client/ProofsPage";
import InvoicesPage from "./pages/client/InvoicesPage";
import AppointmentsPage from "./pages/client/AppointmentsPage";
import QuotesPage from "./pages/client/QuotesPage";
import ContactPage from "./pages/public/ContactPage";
import AdminContactMessagesPage from "./pages/admin/AdminContactMessagesPage";
import NewsletterPage from "./pages/public/NewsletterPage";
import LegalPage from "./pages/public/LegalPage";
import LaSallePage from "./pages/public/LaSallePage";
import FaqPage from "./pages/public/FaqPage";
import GalleryPage from "./pages/public/GalleryPage";
import ReviewsPage from "./pages/public/ReviewsPage";
import PartnersPage from "./pages/public/PartnersPage";
import OtpPage from "./pages/auth/OtpPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import MessagesPage from "./pages/client/MessagesPage";
import NotificationsPage from "./pages/client/NotificationsPage";
import GalleryFavoritesPage from "./pages/client/GalleryFavoritesPage";
import MyReviewsPage from "./pages/client/MyReviewsPage";
import GuestListPage from "./pages/client/GuestListPage";
import ProfilePage from "./pages/client/ProfilePage";
import PreferencesPage from "./pages/client/PreferencesPage";
import HelpPage from "./pages/client/HelpPage";
import LocalPayerPage from "./pages/client/LocalPayerPage";
import SecurityPage from "./pages/client/SecurityPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCalendarPage from "./pages/admin/AdminCalendarPage";
import AdminAvailabilityPage from "./pages/admin/AdminAvailabilityPage";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminBookingDetailsPage from "./pages/admin/AdminBookingDetailsPage";
import AdminAppointmentsPage from "./pages/admin/AdminAppointmentsPage";
import AdminClientsPage from "./pages/admin/AdminClientsPage";
import AdminClientDetailsPage from "./pages/admin/AdminClientDetailsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminGalleryPage from "./pages/admin/AdminGalleryPage";
import AdminDayOfPage from "./pages/admin/AdminDayOfPage";
import SuperDashboardPage from "./pages/super/SuperDashboardPage";
import SuperTeamPage from "./pages/super/SuperTeamPage";
import SuperPacksPage from "./pages/super/SuperPacksPage";
import SuperCurrenciesPage from "./pages/super/SuperCurrenciesPage";
import SuperPaymentsPage from "./pages/super/SuperPaymentsPage";
import SuperEmailsPage from "./pages/super/SuperEmailsPage";
import SuperSmsPage from "./pages/super/SuperSmsPage";
import SuperNewsletterPage from "./pages/super/SuperNewsletterPage";
import SuperPartnersPage from "./pages/super/SuperPartnersPage";
import PageViewTracker from "./components/analytics/PageViewTracker";
import SuperTrackingPage from "./pages/super/SuperTrackingPage";
import SuperSystemPage from "./pages/super/SuperSystemPage";
import SuperPricingPage from "./pages/super/SuperPricingPage";
type RoleRouteRoles = ComponentProps<typeof RoleRoute>["roles"];




const adminRoles: RoleRouteRoles = ["RECEPTION", "MANAGER"];
const superAdminRoles: RoleRouteRoles = ["SUPER_ADMIN"];

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <PageViewTracker />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/la-salle" element={<LaSallePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/packs-tarifs" element={<PacksPricingPage />} />
            <Route path="/evenements/:type" element={<EventPage />} />
            <Route path="/reservation" element={<Navigate to="/reservation/creneau" replace />}/>
            <Route path="/reservation/:step" element={<ReservationPage />} />
            <Route path="/galerie" element={<GalleryPage />} />
            <Route path="/avis" element={<ReviewsPage />} />
            <Route path="/partenaires" element={<PartnersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/newsletter" element={<NewsletterPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/suivi/:token" element={<GuestTrackingPage />} />
            <Route path="/legal/:page" element={<LegalPage />} />
          </Route>

          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />}/>
          <Route
  element={
    <ProtectedRoute>
      <ClientLayout />
    </ProtectedRoute>
  }
>
  <Route path="/espace" element={<DashboardPage />} />
  <Route path="/espace/reservations" element={<BookingsPage />} />
  <Route path="/espace/reservations/:id" element={<BookingDetailsPage />} />
  <Route path="/espace/documents" element={<DocumentsPage />} />
  <Route path="/espace/paiements" element={<PaymentsPage />} />
  <Route path="/espace/preuves" element={<ProofsPage />} />
  <Route path="/espace/nouvelle-reservation" element={<Navigate to="/reservation/creneau" replace />}
/>
    <Route path="/espace/factures" element={<InvoicesPage />} />
  <Route path="/espace/rendez-vous" element={<AppointmentsPage />} />
  <Route path="/espace/devis" element={<QuotesPage />} />
  <Route path="/espace/messages" element={<MessagesPage />} />
  <Route path="/espace/notifications" element={<NotificationsPage />} />
  <Route path="/espace/galerie-favoris" element={<GalleryFavoritesPage />}/>
  <Route path="/espace/avis" element={<MyReviewsPage />} />
  <Route path="/espace/invites" element={<GuestListPage />} />
  <Route path="/espace/profil" element={<ProfilePage />} />
  <Route path="/espace/preferences" element={<PreferencesPage />} />
  <Route path="/espace/aide" element={<HelpPage />} />
  <Route path="/espace/payeur" element={<LocalPayerPage />} />
  <Route path="/espace/securite" element={<SecurityPage />} />

</Route>
         
<Route
  path="/admin"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminDashboardPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/calendrier"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminCalendarPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/disponibilites"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminAvailabilityPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/paiements"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminPaymentsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/messages"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminContactMessagesPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/reservations"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminBookingsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/reservations/:id"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminBookingDetailsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/rendez-vous"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminAppointmentsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/clients"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminClientsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/clients/:kind/:id"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminClientDetailsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/avis"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminReviewsPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/galerie"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminGalleryPage />
    </RoleRoute>
  }
/>

<Route
  path="/admin/jour-j"
  element={
    <RoleRoute roles={adminRoles}>
      <AdminDayOfPage />
    </RoleRoute>
  }
/>


<Route
  path="/super"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperDashboardPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/equipe"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperTeamPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/tarifs"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperPricingPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/packs"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperPacksPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/devises"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperCurrenciesPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/marque"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperPaymentsPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/smtp"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperEmailsPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/sms"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperSmsPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/partenaires"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperPartnersPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/tracking"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperTrackingPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/newsletter"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperNewsletterPage />
    </RoleRoute>
  }
/>

<Route
  path="/super/systeme"
  element={
    <RoleRoute roles={superAdminRoles}>
      <SuperSystemPage />
    </RoleRoute>
  }
/>





        
    

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}