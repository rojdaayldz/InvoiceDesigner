using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InvoiceDesigner.Migrations
{
    /// <inheritdoc />
    public partial class SeedFieldDefinitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "FieldDefinitions",
                columns: new[] { "Id", "Category", "DataType", "DisplayName", "FieldKey", "Source" },
                values: new object[,]
                {
                    { 1, "Müşteri Bilgileri", "text", "Müşteri Adı", "Customer.CompanyName", "Customer" },
                    { 2, "Müşteri Bilgileri", "text", "Adres", "Customer.Address", "Customer" },
                    { 3, "Müşteri Bilgileri", "text", "Vergi Dairesi", "Customer.TaxOffice", "Customer" },
                    { 4, "Müşteri Bilgileri", "text", "Vergi No", "Customer.TaxNumber", "Customer" },
                    { 5, "Müşteri Bilgileri", "text", "Mersis No", "Customer.MersisNo", "Customer" },
                    { 6, "Fatura Bilgileri", "text", "Fatura No", "Invoice.InvoiceNo", "Invoice" },
                    { 7, "Fatura Bilgileri", "date", "Fatura Tarihi", "Invoice.InvoiceDate", "Invoice" },
                    { 8, "Fatura Bilgileri", "decimal", "Ara Toplam", "Invoice.SubTotal", "Invoice" },
                    { 9, "Fatura Bilgileri", "decimal", "KDV Tutarı", "Invoice.TaxAmount", "Invoice" },
                    { 10, "Fatura Bilgileri", "decimal", "Genel Toplam", "Invoice.TotalAmount", "Invoice" },
                    { 11, "Ürün Bilgileri", "text", "Ürün/Hizmet Adı", "Item.ProductName", "InvoiceItem" },
                    { 12, "Ürün Bilgileri", "decimal", "Adet", "Item.Quantity", "InvoiceItem" },
                    { 13, "Ürün Bilgileri", "decimal", "Birim Fiyat", "Item.UnitPrice", "InvoiceItem" },
                    { 14, "Ürün Bilgileri", "decimal", "KDV Oranı", "Item.VatRate", "InvoiceItem" },
                    { 15, "Ürün Bilgileri", "decimal", "Satır Toplamı", "Item.LineTotal", "InvoiceItem" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "FieldDefinitions",
                keyColumn: "Id",
                keyValue: 15);
        }
    }
}
