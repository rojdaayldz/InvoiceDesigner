using InvoiceDesigner.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceDesigner.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Customer> Customers { get; set; }

        public DbSet<Invoice> Invoices { get; set; }

        public DbSet<InvoiceItem> InvoiceItems { get; set; }

        public DbSet<Template> Templates { get; set; }

        public DbSet<FieldDefinition> FieldDefinitions { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<FieldDefinition>().HasData(
                new FieldDefinition { Id = 1, FieldKey = "Customer.CompanyName", DisplayName = "Müşteri Adı", Category = "Müşteri Bilgileri", Source = "Customer", DataType = "text" },
                new FieldDefinition { Id = 2, FieldKey = "Customer.Address", DisplayName = "Adres", Category = "Müşteri Bilgileri", Source = "Customer", DataType = "text" },
                new FieldDefinition { Id = 3, FieldKey = "Customer.TaxOffice", DisplayName = "Vergi Dairesi", Category = "Müşteri Bilgileri", Source = "Customer", DataType = "text" },
                new FieldDefinition { Id = 4, FieldKey = "Customer.TaxNumber", DisplayName = "Vergi No", Category = "Müşteri Bilgileri", Source = "Customer", DataType = "text" },
                new FieldDefinition { Id = 5, FieldKey = "Customer.MersisNo", DisplayName = "Mersis No", Category = "Müşteri Bilgileri", Source = "Customer", DataType = "text" },

                new FieldDefinition { Id = 6, FieldKey = "Invoice.InvoiceNo", DisplayName = "Fatura No", Category = "Fatura Bilgileri", Source = "Invoice", DataType = "text" },
                new FieldDefinition { Id = 7, FieldKey = "Invoice.InvoiceDate", DisplayName = "Fatura Tarihi", Category = "Fatura Bilgileri", Source = "Invoice", DataType = "date" },
                new FieldDefinition { Id = 8, FieldKey = "Invoice.SubTotal", DisplayName = "Ara Toplam", Category = "Fatura Bilgileri", Source = "Invoice", DataType = "decimal" },
                new FieldDefinition { Id = 9, FieldKey = "Invoice.TaxAmount", DisplayName = "KDV Tutarı", Category = "Fatura Bilgileri", Source = "Invoice", DataType = "decimal" },
                new FieldDefinition { Id = 10, FieldKey = "Invoice.TotalAmount", DisplayName = "Genel Toplam", Category = "Fatura Bilgileri", Source = "Invoice", DataType = "decimal" },

                new FieldDefinition { Id = 11, FieldKey = "Item.ProductName", DisplayName = "Ürün/Hizmet Adı", Category = "Ürün Bilgileri", Source = "InvoiceItem", DataType = "text" },
                new FieldDefinition { Id = 12, FieldKey = "Item.Quantity", DisplayName = "Adet", Category = "Ürün Bilgileri", Source = "InvoiceItem", DataType = "decimal" },
                new FieldDefinition { Id = 13, FieldKey = "Item.UnitPrice", DisplayName = "Birim Fiyat", Category = "Ürün Bilgileri", Source = "InvoiceItem", DataType = "decimal" },
                new FieldDefinition { Id = 14, FieldKey = "Item.VatRate", DisplayName = "KDV Oranı", Category = "Ürün Bilgileri", Source = "InvoiceItem", DataType = "decimal" },
                new FieldDefinition { Id = 15, FieldKey = "Item.LineTotal", DisplayName = "Satır Toplamı", Category = "Ürün Bilgileri", Source = "InvoiceItem", DataType = "decimal" }
            );
        }
    }
}