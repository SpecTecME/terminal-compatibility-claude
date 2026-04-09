using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("UdfConfiguration")]
public class UdfConfiguration : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Module { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string UdfCode { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Label { get; set; }

    public bool IncludeInSearch { get; set; } = true;
    public bool CreateList { get; set; } = false;

    [Required]
    [MaxLength(20)]
    public string FieldType { get; set; } = "Text";

    public int MaxLength { get; set; }
    public int? SortOrder { get; set; }

    // Navigation
    public ICollection<UdfListValue> ListValues { get; set; } = new List<UdfListValue>();
}
