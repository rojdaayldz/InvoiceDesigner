namespace InvoiceDesigner.Models
{
    public class Customer
    {
        public int Id { get; set; }

        public string CompanyName { get; set; }
        public string TaxOffice { get; set; }
        public string TaxNumber { get; set; }
        public string MersisNo { get; set; }

        public string Address { get; set; }
        public string Phone { get; set; }
        public string Email { get; set; }
        public string AuthorizedPerson { get; set; }

        public List<Invoice> Invoices { get; set; }
    }
}