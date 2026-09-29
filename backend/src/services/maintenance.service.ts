import { expireBookingHolds } from "./booking.service";
import { processQueuedSystemJobs } from "./system-job.service";

let maintenanceStarted = false;

export function startMaintenanceJobs() {
  if (maintenanceStarted) {
    return;
  }

  maintenanceStarted = true;

  void expireBookingHolds().catch((error) =>
    console.error("Initial hold expiration failed:", error)
  );

  void processQueuedSystemJobs().catch((error) =>
    console.error("Initial system-job processing failed:", error)
  );

  setInterval(() => {
    void expireBookingHolds().catch((error) =>
      console.error("Scheduled hold expiration failed:", error)
    );
  }, 5 * 60 * 1000);

  setInterval(() => {
    void processQueuedSystemJobs().catch((error) =>
      console.error("Scheduled system-job processing failed:", error)
    );
  }, 15 * 1000);
}