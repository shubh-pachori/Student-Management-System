using System;

namespace AcademicService.Helpers
{
    public static class TimeHelper
    {
        private static readonly TimeZoneInfo IstTimeZone;

        static TimeHelper()
        {
            try
            {
                // Windows timezone ID
                IstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                // Unix/macOS timezone ID
                IstTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Kolkata");
            }
        }

        public static DateTime ToIst(DateTime utcTime)
        {
            return TimeZoneInfo.ConvertTimeFromUtc(utcTime.Kind == DateTimeKind.Utc ? utcTime : DateTime.SpecifyKind(utcTime, DateTimeKind.Utc), IstTimeZone);
        }

        public static DateTime GetCurrentIst()
        {
            return ToIst(DateTime.UtcNow);
        }
    }
}
