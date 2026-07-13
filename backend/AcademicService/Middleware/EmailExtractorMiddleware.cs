using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;

namespace AcademicService.Middleware
{
    public class EmailExtractorMiddleware
    {
        private readonly RequestDelegate _next;

        public EmailExtractorMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var emailClaim = context.User.FindFirst(ClaimTypes.Email)?.Value 
                                 ?? context.User.FindFirst("email")?.Value;
                var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value 
                                ?? context.User.FindFirst("role")?.Value;

                if (!string.IsNullOrEmpty(emailClaim))
                {
                    context.Items["UserEmail"] = emailClaim;
                }

                if (!string.IsNullOrEmpty(roleClaim))
                {
                    context.Items["UserRole"] = roleClaim;
                }
            }

            await _next(context);
        }
    }
}
