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
    public class SubjectController : ControllerBase
    {
        private readonly ISubjectRepository _subjectRepository;

        public SubjectController(ISubjectRepository subjectRepository)
        {
            _subjectRepository = subjectRepository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Code) || string.IsNullOrEmpty(request.Name))
            {
                return BadRequest("Code and Name are required.");
            }

            var existing = await _subjectRepository.GetByCodeAsync(request.Code);
            if (existing != null)
            {
                return BadRequest(new { success = false, message = "Subject with this code already exists." });
            }

            var subject = new Subject
            {
                Id = Guid.NewGuid(),
                Code = request.Code,
                Name = request.Name,
                Department = request.Department ?? "General",
                CreatedAt = TimeHelper.GetCurrentIst()
            };

            await _subjectRepository.AddAsync(subject);
            return Ok(new { success = true, data = subject });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var subjects = await _subjectRepository.GetAllAsync();
            return Ok(new { success = true, data = subjects });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var subject = await _subjectRepository.GetByIdAsync(id);
            if (subject == null) return NotFound();
            return Ok(new { success = true, data = subject });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectRequest request)
        {
            var subject = await _subjectRepository.GetByIdAsync(id);
            if (subject == null) return NotFound();

            subject.Name = request.Name ?? subject.Name;
            subject.Department = request.Department ?? subject.Department;

            await _subjectRepository.UpdateAsync(subject);
            return Ok(new { success = true, data = subject });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var subject = await _subjectRepository.GetByIdAsync(id);
            if (subject == null) return NotFound();

            await _subjectRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Subject deleted successfully." });
        }
    }

    public class CreateSubjectRequest
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public string Department { get; set; }
    }

    public class UpdateSubjectRequest
    {
        public string Name { get; set; }
        public string Department { get; set; }
    }
}
