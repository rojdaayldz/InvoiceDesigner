namespace InvoiceDesigner.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }

        public string ProductName { get; set; }

        public decimal Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal VatRate { get; set; }

        public decimal LineTotal { get; set; }

        public Invoice Invoice { get; set; }
        public string ProductCode { get; set; }
    }
}