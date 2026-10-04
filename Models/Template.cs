namespace InvoiceDesigner.Models
{
    public class Template
    {
        public int Id { get; set; }

        public string TemplateName { get; set; }

        public string TemplateJson { get; set; }

        public string? PreviewImage { get; set; }

        public DateTime CreatedDate { get; set; }

        public List<Invoice> Invoices { get; set; }
    }
}