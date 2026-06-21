package parking_Building_Management_System.exception;

public class BookingExpiredException extends RuntimeException {
    public BookingExpiredException(String message) {
        super(message);
    }

    public BookingExpiredException(String message, Throwable cause) {
        super(message, cause);
    }
}
