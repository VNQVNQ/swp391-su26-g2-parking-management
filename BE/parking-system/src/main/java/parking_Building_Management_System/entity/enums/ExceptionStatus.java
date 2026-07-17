package parking_Building_Management_System.entity.enums;

public enum ExceptionStatus {
    PENDING("Pending"),
    IN_PROGRESS("In Progress"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    RESOLVED("Resolved");

    private final String displayName;

    ExceptionStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

