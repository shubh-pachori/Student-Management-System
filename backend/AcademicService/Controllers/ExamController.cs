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
    public class ExamController : ControllerBase
    {
        private readonly IExamRepository _examRepository;

        public ExamController(IExamRepository examRepository)
        {
            _examRepository = examRepository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateExam([FromBody] CreateExamRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Title)) return BadRequest();

            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Teachers are not authorized to manage exams. Only Lab Admins or Admins can." });
            }

            var exam = new Exam
            {
                Id = Guid.NewGuid(),
                ClassId = request.ClassId,
                SubjectId = request.SubjectId,
                Title = request.Title,
                ExamDate = TimeHelper.ToIst(request.ExamDate),
                MaxMarks = request.MaxMarks
            };

            await _examRepository.AddAsync(exam);
            return Ok(new { success = true, data = exam });
        }

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClass(Guid classId)
        {
            var exams = await _examRepository.GetByClassIdAsync(classId);
            return Ok(new { success = true, data = exams });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var exam = await _examRepository.GetByIdAsync(id);
            if (exam == null) return NotFound();
            return Ok(new { success = true, data = exam });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExamRequest request)
        {
            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Only Lab Admins or Admins can modify exams." });
            }

            var exam = await _examRepository.GetByIdAsync(id);
            if (exam == null) return NotFound();

            exam.Title = request.Title ?? exam.Title;
            if (request.ExamDate.HasValue)
            {
                exam.ExamDate = TimeHelper.ToIst(request.ExamDate.Value);
            }
            if (request.MaxMarks.HasValue)
            {
                exam.MaxMarks = request.MaxMarks.Value;
            }

            await _examRepository.UpdateAsync(exam);
            return Ok(new { success = true, data = exam });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Only Lab Admins or Admins can delete exams." });
            }

            var exam = await _examRepository.GetByIdAsync(id);
            if (exam == null) return NotFound();

            await _examRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Exam deleted successfully." });
        }

        // --- EXAM MARKS ---

        [HttpPost("marks")]
        public async Task<IActionResult> GiveExamMarks([FromBody] GiveExamMarksRequest request)
        {
            if (request == null) return BadRequest();

            var role = HttpContext.Items["UserRole"]?.ToString() 
                       ?? User.FindFirst("role")?.Value;

            if (role != null && role.Equals("Teacher", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403, new { success = false, message = "Only Lab Admins or Admins can manage exam marks." });
            }

            var existing = await _examRepository.GetStudentMarksAsync(request.ExamId, request.EnrollmentNumber);

            var marks = new ExamMarks
            {
                Id = existing?.Id ?? Guid.NewGuid(),
                ExamId = request.ExamId,
                EnrollmentNumber = request.EnrollmentNumber,
                Marks = request.Marks,
                Remarks = request.Remarks ?? "",
                IsLocked = true
            };

            await _examRepository.SaveMarksAsync(marks);
            return Ok(new { success = true, data = marks });
        }

        [HttpGet("{id}/marks")]
        public async Task<IActionResult> GetMarks(Guid id)
        {
            var marks = await _examRepository.GetMarksByExamIdAsync(id);
            return Ok(new { success = true, data = marks });
        }
    }

    public class CreateExamRequest
    {
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public string Title { get; set; }
        public DateTime ExamDate { get; set; }
        public decimal MaxMarks { get; set; }
    }

    public class UpdateExamRequest
    {
        public string Title { get; set; }
        public DateTime? ExamDate { get; set; }
        public decimal? MaxMarks { get; set; }
    }

    public class GiveExamMarksRequest
    {
        public Guid ExamId { get; set; }
        public string EnrollmentNumber { get; set; }
        public decimal Marks { get; set; }
        public string Remarks { get; set; }
    }
}
