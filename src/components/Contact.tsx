const Contact = () => {
  return (
    <section className="bg-white dark:bg-gray-900" id="contact">
      <div className="container mx-auto px-6 py-12">
        <div>
          <p className="text-blue-500 dark:text-blue-400 font-medium">Kontaktujte nás</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
            Náš tím sa Vám bude venovať
          </h1>
        </div>

        <div className="grid gap-12 mt-10 lg:grid-cols-2">
          <div className="grid gap-12 md:grid-cols-2">
            {contactMethods.map(({ icon, title, description, detail }, index) => (
              <div key={index}>
                <span className="inline-block p-3 bg-blue-100/80 dark:bg-gray-800 rounded-full text-blue-500">
                  {icon}
                </span>
                <h2 className="mt-4 text-base font-medium text-gray-800 dark:text-white">{title}</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                <p className="mt-2 text-sm text-blue-500 dark:text-blue-400">{detail}</p>
              </div>
            ))}
          </div>

          <div className="p-4 py-6 md:p-8 rounded-lg bg-gray-50 dark:bg-gray-800">
            <form>
              <div className="md:flex md:items-center -mx-2">
                <InputField label="Meno" placeholder="John" className="flex-1 px-2" />
                <InputField label="Priezvisko" placeholder="Doe" className="flex-1 px-2 mt-4 md:mt-0" />
              </div>
              <InputField  label="Email" type="email"  placeholder="@gmail.com" className="mt-4" />
              <div className="w-full mt-4">
                <label className="block text-sm text-gray-600 dark:text-gray-200 mb-2">Správa</label>
                <textarea
                  className="block w-full h-32 md:h-56 px-5 py-2.5 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-opacity-40 dark:placeholder-gray-600"
                  placeholder="Text"
                ></textarea>
              </div>
              <button className="w-full mt-4 px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition bg-blue-500 rounded-lg hover:bg-blue-400 focus:ring focus:ring-blue-300 focus:ring-opacity-50">
                Send message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const InputField = ({ 
  label, 
  type = "text", 
  placeholder, 
  className 
}: {
  label: string;
  type?: string;
  placeholder: string;
  className: string;
}) => (
  <div className={className}>
    <label className="block text-sm text-gray-600 dark:text-gray-200 mb-2">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      className="block w-full px-5 py-2.5 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 focus:outline-none focus:ring focus:ring-blue-400 focus:ring-opacity-40 dark:placeholder-gray-600"
    />
  </div>
);

const contactMethods = [
  {
    icon: <img src="/assets/icons/email.svg" alt="Email" className="w-8 h-8" />, // Replace with actual icons
    title: "Email",
    description: "",
    detail: "info@okruhly-stol.sk",
  },
  {
    icon: <img src="/assets/icons/office.svg" alt="Office" className="w-8 h-8" />, // Replace with actual icons
    title: "Stredisko",
    detail: "Jarkova 77 080 01 Prešov",
  },
  {
    icon: <img src="/assets/icons/bank.svg" alt="Bank" className="w-8 h-8" />,
    title: "Bankový účet",
    description: "IČO: 53052056",
    detail: "IBAN: SK13 8330 0000 0021 0184 3292",
  },
];

export default Contact;