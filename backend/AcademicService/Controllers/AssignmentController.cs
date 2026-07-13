using AcademicService.Helpers;
using AcademicService.Models;
using AcademicService.Repositories;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace AcademicService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentController : ControllerBase
    {
        private readonly IAssignmentRepository _assignmentRepository;

        public AssignmentController(IAssignmentRepository assignmentRepository)
        {
            _assignmentRepository = assignmentRepository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Title)) return BadRequest();

            var assignment = new Assignment
            {
                Id = Guid.NewGuid(),
                ClassId = request.ClassId,
                SubjectId = request.SubjectId,
                TeacherId = request.TeacherId,
                Title = request.Title,
                Description = request.Description ?? "",
                DueDate = TimeHelper.ToIst(request.DueDate)
            };

            await _assignmentRepository.AddAsync(assignment);
            return Ok(new { success = true, data = assignment });
        }

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClass(Guid classId)
        {
            var assignments = await _assignmentRepository.GetByClassIdAsync(classId);
            return Ok(new { success = true, data = assignments });
        }

        [HttpGet("teacher/{teacherId}")]
        public async Task<IActionResult> GetByTeacher(Guid teacherId)
        {
            var assignments = await _assignmentRepository.GetByTeacherIdAsync(teacherId);
            return Ok(new { success = true, data = assignments });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);
            if (assignment == null) return NotFound();
            return Ok(new { success = true, data = assignment });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssignmentRequest request)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);
            if (assignment == null) return NotFound();

            assignment.Title = request.Title ?? assignment.Title;
            assignment.Description = request.Description ?? assignment.Description;
            if (request.DueDate.HasValue)
            {
                assignment.DueDate = TimeHelper.ToIst(request.DueDate.Value);
            }

            await _assignmentRepository.UpdateAsync(assignment);
            return Ok(new { success = true, data = assignment });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(id);
            if (assignment == null) return NotFound();

            await _assignmentRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Assignment deleted successfully." });
        }

        // --- ASSIGNMENT MARKS ENDPOINTS ---

        [HttpPost("marks")]
        public async Task<IActionResult> GiveMarks([FromBody] GiveMarksRequest request)
        {
            if (request == null) return BadRequest();

            var existing = await _assignmentRepository.GetStudentMarksAsync(request.AssignmentId, request.EnrollmentNumber);
            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (existing != null && existing.IsLocked)
            {
                if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
                {
                    return StatusCode(403, new { success = false, message = "Marks are locked. Once submitted, only Lab Admins or Admins can edit assignment marks." });
                }
            }

            var marks = new AssignmentMarks
            {
                Id = existing?.Id ?? Guid.NewGuid(),
                AssignmentId = request.AssignmentId,
                EnrollmentNumber = request.EnrollmentNumber,
                Marks = request.Marks,
                Remarks = request.Remarks ?? "",
                IsLocked = true
            };

            await _assignmentRepository.SaveMarksAsync(marks);
            return Ok(new { success = true, message = "Marks submitted and locked successfully.", data = marks });
        }

        [HttpGet("{id}/marks")]
        public async Task<IActionResult> GetMarks(Guid id)
        {
            var marks = await _assignmentRepository.GetMarksByAssignmentIdAsync(id);
            return Ok(new { success = true, data = marks });
        }
    }

    public class CreateAssignmentRequest
    {
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime DueDate { get; set; }
    }

    public class UpdateAssignmentRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class GiveMarksRequest
    {
        public Guid AssignmentId { get; set; }
        public string EnrollmentNumber { get; set; }
        public decimal Marks { get; set; }
        public string Remarks { get; set; }
    }
}
