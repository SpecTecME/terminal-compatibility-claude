using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("UdfListValue")]
public class UdfListValue : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Module { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    public string UdfCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Value { get; set; } = string.Empty;

    public int? SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
