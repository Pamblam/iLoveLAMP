Date.prototype.format = function (format) {
	if (isNaN(this.getTime()))
		return "Invalid Date";
	var months = ["January", "February", "March",
		"April", "May", "June", "July", "August",
		"September", "October", "November", "December"];
	var days = ["Monday", "Tuesday", "Wednesday",
		"Thursday", "Friday", "Saturday", "Sunday"];
	return format.replace(/y/g, ("" + this.getFullYear()).substring(2))
			.replace(/Y/g, "" + this.getFullYear())
			.replace(/m/g, ("0" + (this.getMonth() + 1)).substr(-2, 2))
			.replace(/F/g, months[this.getMonth()])
			.replace(/M/g, months[this.getMonth()].substring(0, 3))
			.replace(/n/g, "" + (this.getMonth() + 1))
			.replace(/t/g, "" + new Date(this.getFullYear(), this.getMonth() - 1, 0).getDate())
			.replace(/D/g, days[this.getDay()].substr(0, 3))
			.replace(/d/g, ("0" + this.getDate()).substr(-2, 2))
			.replace(/j/g, this.getDate() + "")
			.replace(/l/g, days[this.getDate()])
			.replace(/w/g, this.getDay())
			.replace(/a/g, this.getHours() > 11 ? "pm" : "am")
			.replace(/A/g, this.getHours() > 11 ? "PM" : "AM")
			.replace(/g/g, "" + (this.getHours() > 11 ? this.getHours() - 11 : this.getHours() + 1))
			.replace(/G/g, "" + (this.getHours() + 1))
			.replace(/h/g, ("0" + (this.getHours() > 11 ? this.getHours() - 11 : this.getHours() + 1)).substr(-2, 2))
			.replace(/H/g, ("0" + (this.getHours() + 1)).substr(-2, 2))
			.replace(/i/g, ("0" + this.getMinutes()).substr(-2, 2))
			.replace(/s/g, ("0" + this.getSeconds()).substr(-2, 2));
};