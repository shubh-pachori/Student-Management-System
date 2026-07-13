using IdentityService.Data;
using IdentityService.Helpers;
using IdentityService.Middleware;
using IdentityService.Models;
using IdentityService.Repositories;
using IdentityService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using System.Threading.Tasks;
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=sms_identity;Username=shubh;Password=";
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseNpgsql(connectionString));

// Repositories & Services DI
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddHttpClient<ISyncService, SyncService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// JWT Authentication Setup
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "sms_auth_provider",
            ValidAudience = builder.Configuration["JwtSettings:Audience"] ?? "sms_client",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["JwtSettings:Key"] ?? "super_secret_key_student_management_system_2026_antigravity"))
        };
    });

var app = builder.Build();

// Middlewares execution order
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<EmailExtractorMiddleware>();

app.MapControllers();

// Database initialization & Seeding
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<IdentityDbContext>();
        // Ensure database created
        await context.Database.EnsureCreatedAsync();

        // Seed default Admin if not exists
        var userRepo = services.GetRequiredService<IUserRepository>();
        var adminEmail = "admin@school.com";
        var existingAdmin = await userRepo.GetByEmailAsync(adminEmail);
        if (existingAdmin == null)
        {
            var admin = new User
            {
                Id = Guid.NewGuid(),
                EmployeeId = "EMP-2026-0000",
                Name = "Principal Admin",
                Email = adminEmail,
                PhoneNumber = "+919999999999",
                Gender = "Male",
                DateOfBirth = new DateTime(1980, 1, 1),
                PasswordHash = PasswordHasher.HashPassword("AdminPassword123"),
                Role = "Admin",
                ProfilePictureUrl = "",
                CreatedAt = TimeHelper.GetCurrentIst()
            };
            await userRepo.AddAsync(admin);
            Console.WriteLine("Seeded initial Principal Admin user: admin@school.com / AdminPassword123");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error seeding data: {ex.Message}");
    }
}

app.Run();
