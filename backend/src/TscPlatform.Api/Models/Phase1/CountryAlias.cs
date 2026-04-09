using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("CountryAlias")]
public class CountryAlias : BaseEntity
{
    // FK to Country
    public int CountryId { get; set; }

    /// <summary>Country publicId — kept for migration portability</summary>
    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Alias { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(CountryId))]
    public Country Country { get; set; } = null!;
}
