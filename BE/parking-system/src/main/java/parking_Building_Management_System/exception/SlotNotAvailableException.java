package parking_Building_Management_System.exception;

public class SlotNotAvailableException extends RuntimeException {
    public SlotNotAvailableException(String message) {
        super(message);
    }

    public SlotNotAvailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
