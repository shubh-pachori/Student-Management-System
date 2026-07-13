using System;

namespace IdentityService.Models
{
    public class Otp
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string OtpCode { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
    }
}
