using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace IdentityService.Services
{
    public class SyncService : ISyncService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SyncService> _logger;
        private readonly string _academicServiceUrl;

        public SyncService(HttpClient httpClient, IConfiguration config, ILogger<SyncService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _academicServiceUrl = config["AcademicServiceUrl"] ?? "http://localhost:5002";
        }

        public async Task SyncUserAsync(Guid id, string role, string name, string identifier, string email)
        {
            try
            {
                var payload = new
                {
                    Id = id,
                    Role = role,
                    Name = name,
                    EmployeeIdOrEnrollment = identifier,
                    Email = email
                };

                var url = $"{_academicServiceUrl}/api/sync/user";
                var response = await _httpClient.PostAsJsonAsync(url, payload);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Failed to sync user {id} to AcademicService. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error syncing user {id} to AcademicService.");
            }
        }

        public async Task DeleteUserAsync(Guid id)
        {
            try
            {
                var url = $"{_academicServiceUrl}/api/sync/user/{id}";
                var response = await _httpClient.DeleteAsync(url);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"Failed to delete synced user {id} in AcademicService. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting synced user {id} in AcademicService.");
            }
        }
    }
}
