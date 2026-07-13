using AcademicService.Models;
using Microsoft.EntityFrameworkCore;

namespace AcademicService.Data
{
    public class AcademicDbContext : DbContext
    {
        public AcademicDbContext(DbContextOptions<AcademicDbContext> options) : base(options)
        {
        }

        public DbSet<Subject> Subjects { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<ClassTeacherAssignment> ClassTeacherAssignments { get; set; }
        public DbSet<ClassSession> ClassSessions { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Assignment> Assignments { get; set; }
        public DbSet<AssignmentMarks> AssignmentMarks { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<ExamMarks> ExamMarks { get; set; }
        public DbSet<UserSync> UserSyncs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Subject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Code).IsUnique();
            });

            modelBuilder.Entity<Class>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<ClassTeacherAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<ClassSession>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<Attendance>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ClassSessionId, e.EnrollmentNumber }).IsUnique();
            });

            modelBuilder.Entity<Assignment>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<AssignmentMarks>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.AssignmentId, e.EnrollmentNumber }).IsUnique();
            });

            modelBuilder.Entity<Exam>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<ExamMarks>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ExamId, e.EnrollmentNumber }).IsUnique();
            });

            modelBuilder.Entity<UserSync>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.EmployeeIdOrEnrollment).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });
        }
    }
}
