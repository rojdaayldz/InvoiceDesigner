using InvoiceDesigner.Data;
using InvoiceDesigner.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace InvoiceDesigner.Controllers
{
    public class DesignerController : Controller
    {
        private readonly ApplicationDbContext _context;


        public DesignerController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Index(string? data)
        {
            if (string.IsNullOrWhiteSpace(data))
            {
                ViewData["IncomingInvoiceBase64"] = null;
                return View();
            }

            try
            {
                // Query string içinde '+' karakterleri boşluğa dönüşebildiği için düzelt.
                var normalizedBase64 = Uri.UnescapeDataString(data.Trim())
                    .Replace(" ", "+");

                // URL-safe Base64 desteği.
                normalizedBase64 = normalizedBase64
                    .Replace('-', '+')
                    .Replace('_', '/');

                // Eksik Base64 padding karakterlerini tamamla.
                var padding = normalizedBase64.Length % 4;
                if (padding == 2) normalizedBase64 += "==";
                else if (padding == 3) normalizedBase64 += "=";
                else if (padding == 1)
                    throw new FormatException("Geçersiz Base64 uzunluğu.");

                // Veriyi doğrula. Decode işlemi designer.js tarafında yapılacak.
                Convert.FromBase64String(normalizedBase64);

                ViewData["IncomingInvoiceBase64"] = normalizedBase64;
                return View();
            }
            catch (FormatException)
            {
                ViewData["IncomingInvoiceBase64"] = null;
                ViewData["IncomingInvoiceError"] =
                    "URL ile gönderilen fatura verisi geçerli bir Base64 formatında değil.";

                return View();
            }
        }

        public IActionResult GetTemplates()
        {
            var templates = _context.Templates
                .OrderByDescending(x => x.Id)
                .Select(x => new { x.Id, x.TemplateName, x.CreatedDate })
                .ToList();

            return Json(templates);
        }

        public IActionResult GetTemplateById(int id)
        {
            var template = _context.Templates.FirstOrDefault(x => x.Id == id);
            if (template == null) return NotFound();

            return Json(new { template.Id, template.TemplateName, template.TemplateJson });
        }

        public IActionResult GetLastTemplate()
        {
            var template = _context.Templates
                .OrderByDescending(x => x.Id)
                .FirstOrDefault();

            if (template == null) return NotFound();

            return Json(new { template.Id, template.TemplateName, template.TemplateJson });
        }

        [HttpPost]
        public IActionResult SaveTemplate([FromBody] Template template)
        {
            if (template == null || string.IsNullOrWhiteSpace(template.TemplateJson))
                return BadRequest(new { success = false, message = "Şablon verisi boş." });

            var name = string.IsNullOrWhiteSpace(template.TemplateName)
                ? "Yeni Şablon"
                : template.TemplateName.Trim();

            Template entity;
            var isNew = template.Id <= 0;

            if (isNew)
            {
                entity = new Template
                {
                    TemplateName = name,
                    TemplateJson = template.TemplateJson,
                    PreviewImage = template.PreviewImage,
                    CreatedDate = DateTime.Now
                };

                _context.Templates.Add(entity);
            }
            else
            {
                entity = _context.Templates.FirstOrDefault(x => x.Id == template.Id);
                if (entity == null)
                    return NotFound(new { success = false, message = "Güncellenecek şablon bulunamadı." });

                entity.TemplateName = name;
                entity.TemplateJson = template.TemplateJson;
                entity.PreviewImage = template.PreviewImage;
            }

            _context.SaveChanges();

            return Json(new
            {
                success = true,
                templateId = entity.Id,
                templateName = entity.TemplateName,
                createdDate = entity.CreatedDate,
                isNew
            });
        }

        [HttpPost]
        public IActionResult RenameTemplate([FromBody] RenameTemplateRequest request)
        {
            if (request == null || request.Id <= 0 || string.IsNullOrWhiteSpace(request.TemplateName))
                return BadRequest(new { success = false, message = "Geçerli bir şablon adı girilmelidir." });

            var template = _context.Templates.FirstOrDefault(x => x.Id == request.Id);
            if (template == null)
                return NotFound(new { success = false, message = "Şablon bulunamadı." });

            template.TemplateName = request.TemplateName.Trim();
            _context.SaveChanges();

            return Json(new { success = true, templateId = template.Id, templateName = template.TemplateName });
        }

        [HttpPost]
        public IActionResult DeleteTemplate(int id)
        {
            var template = _context.Templates.FirstOrDefault(x => x.Id == id);
            if (template == null)
                return NotFound(new { success = false, message = "Şablon bulunamadı." });

            _context.Templates.Remove(template);
            _context.SaveChanges();

            return Json(new { success = true });
        }

        public IActionResult GetFields()
        {
            var fields = _context.FieldDefinitions
                .OrderBy(x => x.Source)
                .ThenBy(x => x.Id)
                .Select(x => new
                {
                    name = x.FieldKey,
                    label = x.DisplayName,
                    category = x.Category,
                    source = x.Source,
                    dataType = x.DataType
                })
                .ToList();

            return Json(fields);
        }

        public IActionResult GetCustomers()
        {
            var customers = _context.Customers
                .OrderBy(x => x.CompanyName)
                .Select(x => new { x.Id, x.CompanyName })
                .ToList();

            return Json(customers);
        }

        public IActionResult GetInvoiceByCustomer(int customerId)
        {
            var invoice = _context.Invoices
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .Where(x => x.CustomerId == customerId)
                .OrderByDescending(x => x.Id)
                .FirstOrDefault();

            if (invoice == null) return NotFound();

            return Json(ToInvoiceJson(invoice));
        }
        public IActionResult GetDatasource()
        {
            var invoice = _context.Invoices
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .OrderByDescending(x => x.Id)
                .FirstOrDefault();

            if (invoice == null)
                return NotFound();

            return Json(ToInvoiceJson(invoice));
        }

        [HttpPost]
        public async Task<IActionResult> GeneratePdf([FromBody] PdfRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Html))
                return BadRequest("PDF için HTML boş.");

            var invoice = _context.Invoices
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .OrderByDescending(x => x.Id)
                .FirstOrDefault();

            if (invoice == null)
                return BadRequest("Fatura bulunamadı.");

            string ReplaceValue(string html, string key, string? value)
            {
                return html
                    .Replace("{{" + key + "}}", value ?? "")
                    .Replace("[" + key + "]", value ?? "");
            }

            string FormatNumber(decimal value)
            {
                return value.ToString("N2");
            }

            string RemoveRawKeyTexts(string html, params string[] keys)
            {
                foreach (var key in keys)
                {
                    html = html.Replace(key, "");
                }

                return html;
            }

            // 1. TEKİL ALANLARI DEĞİŞTİR
            // Hem {{customer.companyName}} hem de [customer.companyName] formatını destekler.
            request.Html = ReplaceValue(request.Html, "customer.companyName", invoice.Customer.CompanyName);
            request.Html = ReplaceValue(request.Html, "customer.address", invoice.Customer.Address);
            request.Html = ReplaceValue(request.Html, "customer.taxOffice", invoice.Customer.TaxOffice);
            request.Html = ReplaceValue(request.Html, "customer.taxNumber", invoice.Customer.TaxNumber);
            request.Html = ReplaceValue(request.Html, "customer.mersisNo", invoice.Customer.MersisNo);
            request.Html = ReplaceValue(request.Html, "customer.phone", invoice.Customer.Phone);
            request.Html = ReplaceValue(request.Html, "customer.email", invoice.Customer.Email);
            request.Html = ReplaceValue(request.Html, "customer.authorizedPerson", invoice.Customer.AuthorizedPerson);

            request.Html = ReplaceValue(request.Html, "invoice.invoiceNo", invoice.InvoiceNo);
            request.Html = ReplaceValue(request.Html, "invoice.invoiceDate", invoice.InvoiceDate.ToString("dd.MM.yyyy"));
            request.Html = ReplaceValue(request.Html, "invoice.subTotal", FormatNumber(invoice.SubTotal));
            request.Html = ReplaceValue(request.Html, "invoice.taxAmount", FormatNumber(invoice.TaxAmount));
            request.Html = ReplaceValue(request.Html, "invoice.totalAmount", FormatNumber(invoice.TotalAmount));
            request.Html = ReplaceValue(request.Html, "invoice.status", invoice.Status);

            // PDF tarafında görünmemesi gereken tasarım yardımcılarını temizle
            // Bazı GrapesJS drop işlemlerinde hücre içinde düz metin olarak sadece field adı kalabiliyor.
            request.Html = RemoveRawKeyTexts(request.Html,
                "customer.companyName",
                "customer.address",
                "customer.taxOffice",
                "customer.taxNumber",
                "customer.mersisNo",
                "customer.phone",
                "customer.email",
                "customer.authorizedPerson",
                "invoice.invoiceNo",
                "invoice.invoiceDate",
                "invoice.subTotal",
                "invoice.taxAmount",
                "invoice.totalAmount",
                "invoice.status");

            // 2. DİNAMİK ITEMS SATIRLARINI ÇOĞALT
            // Tablo içinde items.productName bulunan satırı bulur ve ürün sayısı kadar çoğaltır.
            if (invoice.Items != null && invoice.Items.Any())
            {
                int itemIndex = request.Html.IndexOf("{{items.productName}}", StringComparison.OrdinalIgnoreCase);

                if (itemIndex == -1)
                    itemIndex = request.Html.IndexOf("[items.productName]", StringComparison.OrdinalIgnoreCase);

                if (itemIndex != -1)
                {
                    int rowStart = request.Html.LastIndexOf("<tr", itemIndex, StringComparison.OrdinalIgnoreCase);
                    int rowCloseIndex = request.Html.IndexOf("</tr>", itemIndex, StringComparison.OrdinalIgnoreCase);
                    int rowEnd = rowCloseIndex == -1 ? -1 : rowCloseIndex + "</tr>".Length;

                    if (rowStart != -1 && rowEnd != -1 && rowEnd > rowStart)
                    {
                        string originalRowTemplate = request.Html.Substring(rowStart, rowEnd - rowStart);
                        var multiRowsBuilder = new System.Text.StringBuilder();

                        foreach (var item in invoice.Items)
                        {
                            string currentRow = originalRowTemplate;

                            currentRow = ReplaceValue(currentRow, "items.productName", item.ProductName);
                            currentRow = ReplaceValue(currentRow, "items.quantity", FormatNumber(item.Quantity));
                            currentRow = ReplaceValue(currentRow, "items.unitPrice", FormatNumber(item.UnitPrice));
                            currentRow = ReplaceValue(currentRow, "items.vatRate", FormatNumber(item.VatRate));
                            currentRow = ReplaceValue(currentRow, "items.lineTotal", FormatNumber(item.LineTotal));
                            currentRow = ReplaceValue(currentRow, "items.productCode", item.ProductCode);


                            // Eğer hücrede field adı düz metin olarak kaldıysa PDF'te görünmesin.
                            currentRow = RemoveRawKeyTexts(currentRow,
                                "items.productName",
                                "items.quantity",
                                "items.unitPrice",
                                "items.vatRate",
                                "items.lineTotal");

                            multiRowsBuilder.AppendLine(currentRow);
                        }

                        request.Html = request.Html.Replace(originalRowTemplate, multiRowsBuilder.ToString());
                    }
                }
            }

            var browserFetcher = new BrowserFetcher();
            await browserFetcher.DownloadAsync();
            await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions { Headless = true });
            await using var page = await browser.NewPageAsync();

            var pdfCleanCss = @"
                .report-smart-tag,
                .report-smart-menu,
                .gjs-selected,
                .binding-hover { display:none !important; }
            ";

            var fullHtml = $@"<html><head><style>{request.Css}{pdfCleanCss}</style></head><body>{request.Html}</body></html>";
            await page.SetContentAsync(fullHtml);
            var pdfBytes = await page.PdfDataAsync(new PdfOptions { Format = PaperFormat.A4, PrintBackground = true });

            return File(pdfBytes, "application/pdf", "fatura.pdf");
        }
        private object ToInvoiceJson(Invoice invoice)
        {
            return new
            {
                customer = new
                {
                    companyName = invoice.Customer.CompanyName,
                    address = invoice.Customer.Address,
                    taxOffice = invoice.Customer.TaxOffice,
                    taxNumber = invoice.Customer.TaxNumber,
                    mersisNo = invoice.Customer.MersisNo,
                    phone = invoice.Customer.Phone,
                    email = invoice.Customer.Email,
                    authorizedPerson = invoice.Customer.AuthorizedPerson
                },

                invoice = new
                {
                    invoiceNo = invoice.InvoiceNo,
                    invoiceDate = invoice.InvoiceDate.ToString("dd.MM.yyyy"),
                    subTotal = invoice.SubTotal,
                    taxAmount = invoice.TaxAmount,
                    totalAmount = invoice.TotalAmount,
                    status = invoice.Status
                },

                items = invoice.Items.Select(item => new
                {
                    productName = item.ProductName,
                    quantity = item.Quantity,
                    unitPrice = item.UnitPrice,
                    vatRate = item.VatRate,
                    lineTotal = item.LineTotal,
                    productCode = item.ProductCode,
                }).ToList()
            };
        }
    }

    public class RenameTemplateRequest
    {
        public int Id { get; set; }
        public string TemplateName { get; set; } = string.Empty;
    }
}