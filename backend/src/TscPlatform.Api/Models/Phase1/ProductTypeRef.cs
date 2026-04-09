using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("ProductTypeRef")]
public class ProductTypeRef : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>GAS | LIQUID_BULK | DRY_BULK | UNITIZED | PASSENGER | OTHER</summary>
    [Required]
    [MaxLength(20)]
    public string ProductCategory { get; set; } = string.Empty;

    public bool IsCryogenic { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }
    public string? Notes { get; set; }
}
