using AcademicService.Models;
using AcademicService.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AcademicService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClassController : ControllerBase
    {
        private readonly IClassRepository _classRepository;
        private readonly IUserSyncRepository _userSyncRepository;

        public ClassController(IClassRepository classRepository, IUserSyncRepository userSyncRepository)
        {
            _classRepository = classRepository;
            _userSyncRepository = userSyncRepository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest("Class Name is required.");
            }

            var labAdmin = await _userSyncRepository.GetByIdAsync(request.LabAdminId);
            if (labAdmin == null || labAdmin.Role.ToLower() != "labadmin")
            {
                return BadRequest("Selected Lab Admin is invalid or does not exist.");
            }

            var @class = new Class
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                Year = request.Year,
                Program = request.Program,
                LabAdminId = request.LabAdminId
            };

            await _classRepository.AddAsync(@class);
            return Ok(new { success = true, data = @class });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var classes = await _classRepository.GetAllAsync();
            return Ok(new { success = true, data = classes });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var @class = await _classRepository.GetByIdAsync(id);
            if (@class == null) return NotFound();
            return Ok(new { success = true, data = @class });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassRequest request)
        {
            var @class = await _classRepository.GetByIdAsync(id);
            if (@class == null) return NotFound();

            if (request.LabAdminId.HasValue && request.LabAdminId != @class.LabAdminId)
            {
                var labAdmin = await _userSyncRepository.GetByIdAsync(request.LabAdminId.Value);
                if (labAdmin == null || labAdmin.Role.ToLower() != "labadmin")
                {
                    return BadRequest("Selected Lab Admin is invalid.");
                }
                @class.LabAdminId = request.LabAdminId.Value;
            }

            @class.Name = request.Name ?? @class.Name;
            @class.Year = request.Year ?? @class.Year;
            @class.Program = request.Program ?? @class.Program;

            await _classRepository.UpdateAsync(@class);
            return Ok(new { success = true, data = @class });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var @class = await _classRepository.GetByIdAsync(id);
            if (@class == null) return NotFound();

            await _classRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Class deleted successfully." });
        }

        // --- TEACHER ASSIGNMENT ENDPOINTS (Lab Admin actions) ---

        [HttpPost("assignments")]
        public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherRequest request)
        {
            if (request == null) return BadRequest("Invalid request.");

            var teacher = await _userSyncRepository.GetByIdAsync(request.TeacherId);
            if (teacher == null || teacher.Role.ToLower() != "teacher")
            {
                return BadRequest("Selected Teacher is invalid.");
            }

            var assignment = new ClassTeacherAssignment
            {
                Id = Guid.NewGuid(),
                ClassId = request.ClassId,
                SubjectId = request.SubjectId,
                TeacherId = request.TeacherId,
                ScheduleTime = request.ScheduleTime ?? ""
            };

            await _classRepository.AssignTeacherAsync(assignment);
            return Ok(new { success = true, data = assignment });
        }

        [HttpGet("{classId}/assignments")]
        public async Task<IActionResult> GetAssignmentsByClass(Guid classId)
        {
            var assignments = await _classRepository.GetAssignmentsByClassIdAsync(classId);
            return Ok(new { success = true, data = assignments });
        }

        [HttpGet("teacher/{teacherId}/assignments")]
        public async Task<IActionResult> GetAssignmentsByTeacher(Guid teacherId)
        {
            var assignments = await _classRepository.GetAssignmentsByTeacherIdAsync(teacherId);
            return Ok(new { success = true, data = assignments });
        }

        [HttpDelete("assignments/{id}")]
        public async Task<IActionResult> RemoveAssignment(Guid id)
        {
            await _classRepository.RemoveAssignmentAsync(id);
            return Ok(new { success = true, message = "Teacher assignment removed successfully." });
        }
    }

    public class CreateClassRequest
    {
        public string Name { get; set; }
        public int Year { get; set; }
        public string Program { get; set; }
        public Guid LabAdminId { get; set; }
    }

    public class UpdateClassRequest
    {
        public string Name { get; set; }
        public int? Year { get; set; }
        public string Program { get; set; }
        public Guid? LabAdminId { get; set; }
    }

    public class AssignTeacherRequest
    {
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public string ScheduleTime { get; set; }
    }
}
