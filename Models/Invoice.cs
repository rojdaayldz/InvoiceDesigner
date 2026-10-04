namespace InvoiceDesigner.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public int? TemplateId { get; set; }

        public string InvoiceNo { get; set; }
        public DateTime InvoiceDate { get; set; }

        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public string Status { get; set; }

        public Customer Customer { get; set; }
        public Template Template { get; set; }
        public List<InvoiceItem> Items { get; set; }
    }
}