using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("FuelTypeRef")]
public class FuelTypeRef : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>GAS | DISTILLATE | RESIDUAL | ALCOHOL | OTHER</summary>
    [MaxLength(20)]
    public string? Category { get; set; }

    public bool HeatingRequired { get; set; } = false;
    public bool IsCryogenic { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }
}
