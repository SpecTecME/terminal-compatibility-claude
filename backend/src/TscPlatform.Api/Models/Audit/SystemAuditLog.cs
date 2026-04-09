using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Audit;

/// <summary>
/// Does NOT inherit BaseEntity — no publicId or tenantId in this schema.
/// Uses snake_case column names matching the original Base44 schema exactly.
/// </summary>
[Table("SystemAuditLog")]
public class SystemAuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("module_name")]
    public string ModuleName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("entity_name")]
    public string EntityName { get; set; } = string.Empty;

    [MaxLength(36)]
    [Column("record_id")]
    public string? RecordId { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("action_type")]
    public string ActionType { get; set; } = string.Empty;

    [Column("old_value_json")]
    public string? OldValueJson { get; set; }

    [Column("new_value_json")]
    public string? NewValueJson { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("changed_by")]
    public string ChangedBy { get; set; } = string.Empty;

    [Required]
    [Column("changed_at")]
    public DateTime ChangedAt { get; set; }
}
