using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("DocumentCategory")]
public class DocumentCategory : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }

    // Navigation
    public ICollection<DocumentType> DocumentTypes { get; set; } = new List<DocumentType>();
}
