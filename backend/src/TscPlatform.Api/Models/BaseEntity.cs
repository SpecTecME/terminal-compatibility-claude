using System.ComponentModel.DataAnnotations;

namespace TscPlatform.Api.Models;

/// <summary>
/// Common base for all TCS entities.
/// id       = auto-increment PK (replaces Base44 string id)
/// publicId = stable UUID used for migration portability and cross-entity references
/// tenantId = multi-tenancy partition key; indexed on every table
/// </summary>
public abstract class BaseEntity
{
    public int Id { get; set; }

    [Required]
    [MaxLength(36)]
    public string PublicId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string TenantId { get; set; } = string.Empty;
}
