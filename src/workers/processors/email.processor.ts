class EmailProcessor {
    async process(job: any) {
        console.log("📧 Processing Email Job");
        console.log(job.data);

        // Simulate email sending
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("✅ Email Job Completed");
    }
}

export default new EmailProcessor();