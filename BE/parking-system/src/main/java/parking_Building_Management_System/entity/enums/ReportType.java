package parking_Building_Management_System.entity.enums;

public enum ReportType {
    REVENUE("Revenue"),
    UTILIZATION("Utilization"),
    PEAK_HOURS("Peak Hours"),
    VEHICLE_COUNT("Vehicle Count");

    private final String displayName;

    ReportType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}

