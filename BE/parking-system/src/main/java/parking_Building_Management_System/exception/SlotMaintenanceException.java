package parking_Building_Management_System.exception;

public class SlotMaintenanceException extends RuntimeException {
    public SlotMaintenanceException(String message) {
        super(message);
    }

    public SlotMaintenanceException(String message, Throwable cause) {
        super(message, cause);
    }
}
