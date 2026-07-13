using IdentityService.Helpers;
using IdentityService.Models;
using IdentityService.Repositories;
using IdentityService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace IdentityService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IStudentRepository _studentRepository;
        private readonly ISyncService _syncService;

        public AdminController(
            IUserRepository userRepository,
            IStudentRepository studentRepository,
            ISyncService syncService)
        {
            _userRepository = userRepository;
            _studentRepository = studentRepository;
            _syncService = syncService;
        }

        // --- EMPLOYEE (Teacher / LabAdmin) ENDPOINTS ---

        [HttpPost("employees")]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeRequest request)
        {
            if (request == null) return BadRequest("Invalid request.");

            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            var existingStudent = await _studentRepository.GetByEmailAsync(request.Email);
            if (existingUser != null || existingStudent != null)
            {
                return BadRequest(new { success = false, message = "Email already exists in system." });
            }

            var nextEmpId = await _userRepository.GenerateNextEmployeeIdAsync();

            var user = new User
            {
                Id = Guid.NewGuid(),
                EmployeeId = nextEmpId,
                Name = request.Name,
                ProfilePictureUrl = request.ProfilePictureUrl ?? "",
                Email = request.Email,
                PhoneNumber = request.PhoneNumber ?? "",
                Gender = request.Gender ?? "Male",
                DateOfBirth = request.DateOfBirth,
                PasswordHash = PasswordHasher.HashPassword(request.Password ?? "Password123"),
                Role = request.Role,
                CreatedAt = TimeHelper.GetCurrentIst()
            };

            await _userRepository.AddAsync(user);
            await _syncService.SyncUserAsync(user.Id, user.Role, user.Name, user.EmployeeId, user.Email);

            return CreatedAtAction(nameof(GetEmployeeById), new { id = user.Id }, new { success = true, data = user });
        }

        [HttpGet("employees/{id}")]
        public async Task<IActionResult> GetEmployeeById(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(new { success = true, data = user });
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees([FromQuery] string role = null)
        {
            IEnumerable<User> users;
            if (!string.IsNullOrEmpty(role))
            {
                users = await _userRepository.GetByRoleAsync(role);
            }
            else
            {
                users = await _userRepository.GetAllAsync();
            }
            return Ok(new { success = true, data = users });
        }

        [HttpPut("employees/{id}")]
        public async Task<IActionResult> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();

            user.Name = request.Name ?? user.Name;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            user.Gender = request.Gender ?? user.Gender;
            user.DateOfBirth = request.DateOfBirth ?? user.DateOfBirth;
            user.ProfilePictureUrl = request.ProfilePictureUrl ?? user.ProfilePictureUrl;
            
            if (!string.IsNullOrEmpty(request.Password))
            {
                user.PasswordHash = PasswordHasher.HashPassword(request.Password);
            }

            await _userRepository.UpdateAsync(user);
            await _syncService.SyncUserAsync(user.Id, user.Role, user.Name, user.EmployeeId, user.Email);

            return Ok(new { success = true, data = user });
        }

        [HttpDelete("employees/{id}")]
        public async Task<IActionResult> DeleteEmployee(Guid id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound();

            await _userRepository.DeleteAsync(id);
            await _syncService.DeleteUserAsync(id);

            return Ok(new { success = true, message = "Employee deleted successfully." });
        }

        // --- STUDENT ENDPOINTS ---

        [HttpPost("students")]
        public async Task<IActionResult> CreateStudent([FromBody] CreateStudentRequest request)
        {
            if (request == null) return BadRequest("Invalid request.");

            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            var existingStudent = await _studentRepository.GetByEmailAsync(request.Email);
            if (existingUser != null || existingStudent != null)
            {
                return BadRequest(new { success = false, message = "Email already exists in system." });
            }

            var nextEnrollment = await _studentRepository.GenerateNextEnrollmentNumberAsync();

            var student = new Student
            {
                Id = Guid.NewGuid(),
                EnrollmentNumber = nextEnrollment,
                Name = request.Name,
                ProfilePictureUrl = request.ProfilePictureUrl ?? "",
                Email = request.Email,
                PhoneNumber = request.PhoneNumber ?? "",
                Gender = request.Gender ?? "Male",
                DateOfBirth = request.DateOfBirth,
                PasswordHash = PasswordHasher.HashPassword(request.Password ?? "Student123"),
                Year = request.Year,
                Program = request.Program,
                CreatedAt = TimeHelper.GetCurrentIst()
            };

            await _studentRepository.AddAsync(student);
            await _syncService.SyncUserAsync(student.Id, "Student", student.Name, student.EnrollmentNumber, student.Email);

            return CreatedAtAction(nameof(GetStudentById), new { id = student.Id }, new { success = true, data = student });
        }

        [HttpGet("students/{id}")]
        public async Task<IActionResult> GetStudentById(Guid id)
        {
            var student = await _studentRepository.GetByIdAsync(id);
            if (student == null) return NotFound();
            return Ok(new { success = true, data = student });
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _studentRepository.GetAllAsync();
            return Ok(new { success = true, data = students });
        }

        [HttpPut("students/{id}")]
        public async Task<IActionResult> UpdateStudent(Guid id, [FromBody] UpdateStudentRequest request)
        {
            var student = await _studentRepository.GetByIdAsync(id);
            if (student == null) return NotFound();

            student.Name = request.Name ?? student.Name;
            student.PhoneNumber = request.PhoneNumber ?? student.PhoneNumber;
            student.Gender = request.Gender ?? student.Gender;
            student.DateOfBirth = request.DateOfBirth ?? student.DateOfBirth;
            student.Year = request.Year ?? student.Year;
            student.Program = request.Program ?? student.Program;
            student.ProfilePictureUrl = request.ProfilePictureUrl ?? student.ProfilePictureUrl;

            if (!string.IsNullOrEmpty(request.Password))
            {
                student.PasswordHash = PasswordHasher.HashPassword(request.Password);
            }

            await _studentRepository.UpdateAsync(student);
            await _syncService.SyncUserAsync(student.Id, "Student", student.Name, student.EnrollmentNumber, student.Email);

            return Ok(new { success = true, data = student });
        }

        [HttpDelete("students/{id}")]
        public async Task<IActionResult> DeleteStudent(Guid id)
        {
            var student = await _studentRepository.GetByIdAsync(id);
            if (student == null) return NotFound();

            await _studentRepository.DeleteAsync(id);
            await _syncService.DeleteUserAsync(id);

            return Ok(new { success = true, message = "Student deleted successfully." });
        }

        // --- BULK CSV IMPORT ---
        [HttpPost("students/import")]
        public async Task<IActionResult> ImportStudents(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded or file is empty.");
            }

            var importedStudents = new List<Student>();
            var errorRows = new List<string>();

            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                string headerLine = await reader.ReadLineAsync(); // skip header
                int rowNum = 1;

                while (!reader.EndOfStream)
                {
                    rowNum++;
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;

                    var parts = line.Split(',');
                    if (parts.Length < 7)
                    {
                        errorRows.Add($"Row {rowNum}: Missing columns (expected 7, got {parts.Length}).");
                        continue;
                    }

                    var name = parts[0].Trim();
                    var email = parts[1].Trim();
                    var phone = parts[2].Trim();
                    var gender = parts[3].Trim();
                    
                    if (!DateTime.TryParse(parts[4].Trim(), out DateTime dob))
                    {
                        errorRows.Add($"Row {rowNum}: Invalid DateOfBirth format.");
                        continue;
                    }

                    if (!int.TryParse(parts[5].Trim(), out int year))
                    {
                        errorRows.Add($"Row {rowNum}: Invalid Year format.");
                        continue;
                    }

                    var program = parts[6].Trim();

                    var existingUser = await _userRepository.GetByEmailAsync(email);
                    var existingStudent = await _studentRepository.GetByEmailAsync(email);
                    var alreadyImported = importedStudents.Exists(s => s.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

                    if (existingUser != null || existingStudent != null || alreadyImported)
                    {
                        errorRows.Add($"Row {rowNum}: Email '{email}' is duplicate.");
                        continue;
                    }

                    var nextEnrollment = await _studentRepository.GenerateNextEnrollmentNumberAsync();
                    
                    if (importedStudents.Count > 0)
                    {
                        var partsEnr = nextEnrollment.Split('-');
                        int nextSeq = int.Parse(partsEnr[2]) + importedStudents.Count;
                        nextEnrollment = $"{partsEnr[0]}-{partsEnr[1]}-{nextSeq:D4}";
                    }

                    var student = new Student
                    {
                        Id = Guid.NewGuid(),
                        EnrollmentNumber = nextEnrollment,
                        Name = name,
                        Email = email,
                        PhoneNumber = phone,
                        Gender = gender,
                        DateOfBirth = dob,
                        PasswordHash = PasswordHasher.HashPassword("Student123"),
                        Year = year,
                        Program = program,
                        ProfilePictureUrl = "",
                        CreatedAt = TimeHelper.GetCurrentIst()
                    };

                    importedStudents.Add(student);
                }
            }

            foreach (var student in importedStudents)
            {
                await _studentRepository.AddAsync(student);
                await _syncService.SyncUserAsync(student.Id, "Student", student.Name, student.EnrollmentNumber, student.Email);
            }

            return Ok(new
            {
                success = true,
                message = $"Successfully imported {importedStudents.Count} students.",
                errors = errorRows,
                count = importedStudents.Count
            });
        }
    }

    public class CreateEmployeeRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
        public string ProfilePictureUrl { get; set; }
    }

    public class UpdateEmployeeRequest
    {
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Password { get; set; }
        public string ProfilePictureUrl { get; set; }
    }

    public class CreateStudentRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Password { get; set; }
        public int Year { get; set; }
        public string Program { get; set; }
        public string ProfilePictureUrl { get; set; }
    }

    public class UpdateStudentRequest
    {
        public string Name { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Password { get; set; }
        public int? Year { get; set; }
        public string Program { get; set; }
        public string ProfilePictureUrl { get; set; }
    }
}
