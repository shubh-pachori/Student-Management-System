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
    public class SessionController : ControllerBase
    {
        private readonly ISessionRepository _sessionRepository;

        public SessionController(ISessionRepository sessionRepository)
        {
            _sessionRepository = sessionRepository;
        }

        [HttpPost]
        public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest request)
        {
            if (request == null) return BadRequest();

            var session = new ClassSession
            {
                Id = Guid.NewGuid(),
                ClassId = request.ClassId,
                SubjectId = request.SubjectId,
                TeacherId = request.TeacherId,
                SessionDateTime = TimeHelper.ToIst(request.SessionDateTime),
                TopicCovered = "",
                Status = "Scheduled"
            };

            await _sessionRepository.AddAsync(session);
            return Ok(new { success = true, data = session });
        }

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetByClass(Guid classId)
        {
            var sessions = await _sessionRepository.GetByClassIdAsync(classId);
            return Ok(new { success = true, data = sessions });
        }

        [HttpGet("teacher/{teacherId}")]
        public async Task<IActionResult> GetByTeacher(Guid teacherId)
        {
            var sessions = await _sessionRepository.GetByTeacherIdAsync(teacherId);
            return Ok(new { success = true, data = sessions });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var session = await _sessionRepository.GetByIdAsync(id);
            if (session == null) return NotFound();
            return Ok(new { success = true, data = session });
        }

        [HttpPut("reschedule/{id}")]
        public async Task<IActionResult> Reschedule(Guid id, [FromBody] RescheduleRequest request)
        {
            if (request == null) return BadRequest();

            var session = await _sessionRepository.GetByIdAsync(id);
            if (session == null) return NotFound();

            session.SessionDateTime = TimeHelper.ToIst(request.NewDateTime);
            session.Status = "Rescheduled";

            if (request.NewTeacherId.HasValue)
            {
                session.TeacherId = request.NewTeacherId.Value;
            }

            await _sessionRepository.UpdateAsync(session);
            return Ok(new { success = true, data = session });
        }

        [HttpPut("update-topic/{id}")]
        public async Task<IActionResult> UpdateTopic(Guid id, [FromBody] UpdateTopicRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.TopicCovered))
            {
                return BadRequest("Topic covered is required.");
            }

            var session = await _sessionRepository.GetByIdAsync(id);
            if (session == null) return NotFound();

            session.TopicCovered = request.TopicCovered;
            session.Status = "Completed";

            await _sessionRepository.UpdateAsync(session);
            return Ok(new { success = true, data = session });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var session = await _sessionRepository.GetByIdAsync(id);
            if (session == null) return NotFound();

            await _sessionRepository.DeleteAsync(id);
            return Ok(new { success = true, message = "Session deleted successfully." });
        }
    }

    public class CreateSessionRequest
    {
        public Guid ClassId { get; set; }
        public Guid SubjectId { get; set; }
        public Guid TeacherId { get; set; }
        public DateTime SessionDateTime { get; set; }
    }

    public class RescheduleRequest
    {
        public DateTime NewDateTime { get; set; }
        public Guid? NewTeacherId { get; set; }
    }

    public class UpdateTopicRequest
    {
        public string TopicCovered { get; set; }
    }
}
