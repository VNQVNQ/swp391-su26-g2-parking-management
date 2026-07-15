package parking_Building_Management_System.entity.enums;

public enum ExceptionType {
    LOST_TICKET("LostTicket"),
    OVERSTAY("Overstay"),
    WRONG_ZONE("WrongZone"),
    WRONG_SPOT("WrongSpot"),
    UNPAID_EXIT("UnpaidExit");

    private final String displayName;

    ExceptionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

