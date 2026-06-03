package parking_Building_Management_System.entity.enums;

public enum TicketType {
    HOURLY("Hourly"),
    DAILY("Daily"),
    MONTHLY("Monthly");

    private final String displayName;

    TicketType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

