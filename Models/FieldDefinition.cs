namespace InvoiceDesigner.Models
{
    public class FieldDefinition
    {
        public int Id { get; set; }

        public string FieldKey { get; set; }

        public string DisplayName { get; set; }

        public string Category { get; set; }

        public string Source { get; set; }

        public string DataType { get; set; }
    }
}