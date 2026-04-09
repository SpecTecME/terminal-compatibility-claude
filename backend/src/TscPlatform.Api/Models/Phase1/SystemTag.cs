using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("SystemTag")]
public class SystemTag : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Category { get; set; }

    /// <summary>PostgreSQL text[] — entity types this tag can be applied to</summary>
    public string[] AppliesTo { get; set; } = Array.Empty<string>();

    public bool IsSystem { get; set; } = false;
    public bool IsLocked { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }
}
