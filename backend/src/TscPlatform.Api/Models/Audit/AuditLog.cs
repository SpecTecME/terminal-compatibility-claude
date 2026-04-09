using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Audit;

[Table("AuditLog")]
public class AuditLog : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string TableName { get; set; } = string.Empty;

    [Required]
    [MaxLength(36)]
    public string RecordId { get; set; } = string.Empty;

    [MaxLength(36)]
    public string? RecordPublicId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FieldName { get; set; }

    public string? PreviousValue { get; set; }
    public string? NewValue { get; set; }

    [MaxLength(36)]
    public string? UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public string UserEmail { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? UserName { get; set; }

    [Required]
    public DateTime Timestamp { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }
}
